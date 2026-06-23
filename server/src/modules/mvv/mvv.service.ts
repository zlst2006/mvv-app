import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class MvvService {
  private get client() {
    return getSupabaseClient();
  }

  // ========== 用户 ==========

  // 注册申请（填写真实姓名，待审核）
  async applyUser(realName: string) {
    const { data, error } = await this.client
      .from('users')
      .insert({ nickname: realName, real_name: realName, status: 'pending', applied_at: new Date().toISOString() })
      .select('id, nickname, status, created_at')
      .single();
    if (error) throw new Error(`注册申请失败: ${error.message}`);
    return data;
  }

  async getUserById(id: number) {
    const { data, error } = await this.client
      .from('users')
      .select('id, nickname, real_name, status, is_admin, created_at')
      .eq('id', id)
      .single();
    if (error) throw new Error(`查询用户失败: ${error.message}`);
    return data;
  }

  // 管理员登录验证
  async adminLogin(userId: number, password: string) {
    const { data: setting, error } = await this.client
      .from('mvv_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();
    if (error) throw new BadRequestException('查询管理员密码失败');
    if (setting.value !== password) throw new BadRequestException('管理员密码错误');

    // 验证通过，设置该用户为管理员
    const { data: user, error: userError } = await this.client
      .from('users')
      .update({ is_admin: true })
      .eq('id', userId)
      .select('id, nickname, is_admin')
      .single();
    if (userError) throw new Error(`设置管理员失败: ${userError.message}`);
    return user;
  }

  // 管理员登录（简化版，只需密码）
  async adminLoginSimple(password: string) {
    const { data: setting, error } = await this.client
      .from('mvv_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();
    if (error) throw new Error('查询管理员密码失败');
    if (setting.value !== password) throw new Error('管理员密码错误');

    // 返回虚拟管理员用户
    return { id: -1, nickname: '管理员', is_admin: true, status: 'approved' };
  }

  // 获取待审核用户列表
  async getPendingUsers() {
    const { data, error } = await this.client
      .from('users')
      .select('id, nickname, real_name, status, created_at, applied_at')
      .eq('status', 'pending')
      .order('applied_at', { ascending: true });
    if (error) throw new Error(`查询待审核用户失败: ${error.message}`);
    return data ?? [];
  }

  // 获取所有已批准用户
  async getApprovedUsers() {
    const { data, error } = await this.client
      .from('users')
      .select('id, nickname, real_name, status, is_admin, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    if (error) throw new Error(`查询用户列表失败: ${error.message}`);
    return data ?? [];
  }

  // 审批用户
  async approveUser(id: number, approvedBy: number) {
    const { data, error } = await this.client
      .from('users')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
      })
      .eq('id', id)
      .select('id, nickname, real_name, status')
      .single();
    if (error) throw new Error(`审批用户失败: ${error.message}`);
    return data;
  }

  // 拒绝用户
  async rejectUser(id: number) {
    const { data, error } = await this.client
      .from('users')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select('id, nickname, real_name, status')
      .single();
    if (error) throw new Error(`拒绝用户失败: ${error.message}`);
    return data;
  }

  // ========== 管理员设置 ==========

  async getSettings() {
    const { data, error } = await this.client
      .from('mvv_settings')
      .select('key, value');
    if (error) throw new Error(`查询设置失败: ${error.message}`);
    const settings: Record<string, string> = {};
    for (const s of data ?? []) {
      settings[s.key] = s.value;
    }
    return settings;
  }

  async updateSetting(key: string, value: string, updatedBy: number) {
    const { data, error } = await this.client
      .from('mvv_settings')
      .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();
    if (error) throw new Error(`更新设置失败: ${error.message}`);
    return data;
  }

  // 检查当前讨论区设置（是否强制关闭匿名/实名）
  async getChatSettings() {
    const settings = await this.getSettings();
    return {
      forceDisableAnonymous: settings['force_disable_anonymous'] === 'true',
      forceDisableRealname: settings['force_disable_realname'] === 'true',
    };
  }

  // ========== MVV 提交 ==========

  async createSubmission(params: {
    userId: number;
    type: 'mission' | 'vision' | 'values';
    content: string;
    isAnonymous: boolean;
  }) {
    const { data, error } = await this.client
      .from('mvv_submissions')
      .insert({
        user_id: params.userId,
        type: params.type,
        content: params.content,
        is_anonymous: params.isAnonymous,
      })
      .select()
      .single();
    if (error) throw new Error(`创建提交失败: ${error.message}`);

    // 关联查询用户信息
    const fullData = await this.getSubmissionDetail(data.id);
    return fullData;
  }

  async getSubmissionDetail(id: number) {
    const { data, error } = await this.client
      .from('mvv_submissions')
      .select('*, users!inner(id, nickname)')
      .eq('id', id)
      .single();
    if (error) throw new Error(`查询提交详情失败: ${error.message}`);

    // 获取投票数
    const { count } = await this.client
      .from('mvv_votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', id);
    if (count === null) throw new Error('查询投票数失败');

    return {
      ...data,
      vote_count: count,
    };
  }

  async getSubmissions(type?: string) {
    let query = this.client
      .from('mvv_submissions')
      .select('*, users!inner(id, nickname)')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询提交列表失败: ${error.message}`);

    // 批量查询每个 submission 的投票数
    const submissionIds = (data ?? []).map((s: any) => s.id);
    const voteCountMap = new Map<number, number>();

    if (submissionIds.length > 0) {
      const { data: votes, error: voteError } = await this.client
        .from('mvv_votes')
        .select('submission_id');
      if (voteError) throw new Error(`查询投票失败: ${voteError.message}`);

      if (votes) {
        for (const v of votes) {
          voteCountMap.set(
            v.submission_id,
            (voteCountMap.get(v.submission_id) ?? 0) + 1,
          );
        }
      }
    }

    return (data ?? []).map((item: any) => ({
      ...item,
      vote_count: voteCountMap.get(item.id) ?? 0,
    }));
  }

  async getSubmissionsGrouped() {
    const all = await this.getSubmissions();
    return {
      mission: all.filter((s: any) => s.type === 'mission'),
      vision: all.filter((s: any) => s.type === 'vision'),
      values: all.filter((s: any) => s.type === 'values'),
    };
  }

  // ========== 投票 ==========

  async vote(submissionId: number, userId: number) {
    const { data, error } = await this.client
      .from('mvv_votes')
      .insert({ submission_id: submissionId, user_id: userId })
      .select()
      .single();
    if (error) {
      // 唯一约束冲突 = 已经投过票
      if (error.code === '23505') {
        throw new Error('你已经投过票了');
      }
      throw new Error(`投票失败: ${error.message}`);
    }
    return data;
  }

  async unvote(submissionId: number, userId: number) {
    const { error } = await this.client
      .from('mvv_votes')
      .delete()
      .eq('submission_id', submissionId)
      .eq('user_id', userId);
    if (error) throw new Error(`取消投票失败: ${error.message}`);
    return { success: true };
  }

  async getUserVotes(userId: number) {
    const { data, error } = await this.client
      .from('mvv_votes')
      .select('submission_id')
      .eq('user_id', userId);
    if (error) throw new Error(`查询用户投票失败: ${error.message}`);
    return (data ?? []).map((v: any) => v.submission_id);
  }

  // ========== 统计 ==========

  async getStats() {
    const all = await this.getSubmissions();
    const types = ['mission', 'vision', 'values'] as const;

    const result: Record<string, any> = {};
    for (const type of types) {
      const items = all.filter((s: any) => s.type === type);
      // 按投票数降序排列
      items.sort((a: any, b: any) => b.vote_count - a.vote_count);
      result[type] = items;
    }

    // 按人员统计
    const userMap = new Map<number, {
      id: number;
      nickname: string;
      total_submissions: number;
      total_votes_received: number;
      submissions: { mission: any[]; vision: any[]; values: any[] };
    }>();

    for (const item of all) {
      const uid = (item as any).user_id;
      const nickname = (item as any).users?.nickname ?? '匿名用户';
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          id: uid,
          nickname,
          total_submissions: 0,
          total_votes_received: 0,
          submissions: { mission: [], vision: [], values: [] },
        });
      }
      const userStats = userMap.get(uid)!;
      userStats.total_submissions += 1;
      userStats.total_votes_received += (item as any).vote_count ?? 0;
      const type = (item as any).type as 'mission' | 'vision' | 'values';
      userStats.submissions[type].push(item);
    }

    result.users = Array.from(userMap.values())
      .sort((a, b) => b.total_votes_received - a.total_votes_received);

    // 总览数据
    result.overview = {
      total_users: userMap.size,
      total_submissions: all.length,
      total_votes: all.reduce((sum: number, s: any) => sum + (s.vote_count ?? 0), 0),
    };

    return result;
  }

  // ========== 讨论消息 ==========

  async sendMessage(userId: number, content: string, isAnonymous: boolean) {
    // 检查管理员设置
    const chatSettings = await this.getChatSettings();
    if (isAnonymous && chatSettings.forceDisableAnonymous) {
      throw new Error('管理员已关闭匿名发言，请使用实名');
    }
    if (!isAnonymous && chatSettings.forceDisableRealname) {
      throw new Error('管理员已关闭实名发言，请使用匿名');
    }

    const { data, error } = await this.client
      .from('mvv_messages')
      .insert({ user_id: userId, content, is_anonymous: isAnonymous })
      .select('*, users!inner(id, nickname)')
      .single();
    if (error) throw new Error(`发送消息失败: ${error.message}`);
    return data;
  }

  async getMessages(limit = 50, beforeId?: number) {
    let query = this.client
      .from('mvv_messages')
      .select('*, users!inner(id, nickname)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeId) {
      query = query.lt('id', beforeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询消息失败: ${error.message}`);
    return (data ?? []).reverse();
  }

  async getMessageCount() {
    const { count, error } = await this.client
      .from('mvv_messages')
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(`查询消息数失败: ${error.message}`);
    return count ?? 0;
  }
}