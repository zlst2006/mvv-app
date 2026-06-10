import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class MvvService {
  private get client() {
    return getSupabaseClient();
  }

  // ========== 用户 ==========

  async createUser(nickname: string) {
    const { data, error } = await this.client
      .from('users')
      .insert({ nickname })
      .select('id, nickname, created_at')
      .single();
    if (error) throw new Error(`创建用户失败: ${error.message}`);
    return data;
  }

  async getUserById(id: number) {
    const { data, error } = await this.client
      .from('users')
      .select('id, nickname, created_at')
      .eq('id', id)
      .single();
    if (error) throw new Error(`查询用户失败: ${error.message}`);
    return data;
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

    return result;
  }
}