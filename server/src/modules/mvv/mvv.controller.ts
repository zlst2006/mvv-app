import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MvvService } from './mvv.service';

@Controller('mvv')
export class MvvController {
  constructor(private readonly mvvService: MvvService) {}

  // ========== 用户 ==========

  // 注册申请
  @Post('users/apply')
  async applyUser(@Body() body: { real_name: string }) {
    if (!body.real_name || body.real_name.trim().length === 0) {
      throw new BadRequestException('真实姓名不能为空');
    }
    if (body.real_name.trim().length > 50) {
      throw new BadRequestException('姓名不能超过50个字符');
    }
    const data = await this.mvvService.applyUser(body.real_name.trim());
    return { code: 200, msg: 'success', data };
  }

  // 管理员登录
  @Post('users/admin-login')
  async adminLogin(@Body() body: { user_id: number; password: string }) {
    if (!body.user_id) throw new BadRequestException('用户ID不能为空');
    if (!body.password) throw new BadRequestException('管理员密码不能为空');
    const data = await this.mvvService.adminLogin(body.user_id, body.password);
    return { code: 200, msg: 'success', data };
  }

  // 获取所有已批准用户
  @Get('users')
  async getUsers() {
    const data = await this.mvvService.getApprovedUsers();
    return { code: 200, msg: 'success', data };
  }

  // 获取待审核用户列表
  @Get('users/pending')
  async getPendingUsers() {
    const data = await this.mvvService.getPendingUsers();
    return { code: 200, msg: 'success', data };
  }

  // 审批用户
  @Post('users/:id/approve')
  async approveUser(@Param('id') id: string, @Body() body: { approved_by: number }) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) throw new BadRequestException('无效的用户ID');
    if (!body.approved_by) throw new BadRequestException('审批人ID不能为空');
    const data = await this.mvvService.approveUser(userId, body.approved_by);
    return { code: 200, msg: 'success', data };
  }

  // 拒绝用户
  @Post('users/:id/reject')
  async rejectUser(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) throw new BadRequestException('无效的用户ID');
    const data = await this.mvvService.rejectUser(userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('无效的用户ID');
    }
    const data = await this.mvvService.getUserById(userId);
    return { code: 200, msg: 'success', data };
  }

  // ========== 管理员设置 ==========

  @Get('settings')
  async getSettings() {
    const data = await this.mvvService.getSettings();
    return { code: 200, msg: 'success', data };
  }

  @Get('settings/chat')
  async getChatSettings() {
    const data = await this.mvvService.getChatSettings();
    return { code: 200, msg: 'success', data };
  }

  @Post('settings')
  async updateSetting(
    @Body() body: { key: string; value: string; updated_by: number },
  ) {
    if (!body.key) throw new BadRequestException('设置键不能为空');
    if (body.updated_by === undefined) throw new BadRequestException('更新人ID不能为空');
    const data = await this.mvvService.updateSetting(body.key, body.value, body.updated_by);
    return { code: 200, msg: 'success', data };
  }

  // ========== MVV 提交 ==========

  @Post('submissions')
  async createSubmission(
    @Body()
    body: {
      user_id: number;
      type: 'mission' | 'vision' | 'values';
      content: string;
      is_anonymous: boolean;
    },
  ) {
    if (!body.user_id) throw new BadRequestException('用户ID不能为空');
    if (!['mission', 'vision', 'values'].includes(body.type)) {
      throw new BadRequestException('类型必须是 mission/vision/values');
    }
    if (!body.content || body.content.trim().length === 0) {
      throw new BadRequestException('内容不能为空');
    }
    const data = await this.mvvService.createSubmission({
      userId: body.user_id,
      type: body.type,
      content: body.content.trim(),
      isAnonymous: body.is_anonymous ?? false,
    });
    return { code: 200, msg: 'success', data };
  }

  @Get('submissions')
  async getSubmissions(@Query('type') type?: string) {
    if (type && !['mission', 'vision', 'values'].includes(type)) {
      throw new BadRequestException('类型必须是 mission/vision/values');
    }
    const data = await this.mvvService.getSubmissions(type);
    return { code: 200, msg: 'success', data };
  }

  @Get('submissions/grouped')
  async getSubmissionsGrouped() {
    const data = await this.mvvService.getSubmissionsGrouped();
    return { code: 200, msg: 'success', data };
  }

  @Get('submissions/:id')
  async getSubmissionDetail(@Param('id') id: string) {
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      throw new BadRequestException('无效的提交ID');
    }
    const data = await this.mvvService.getSubmissionDetail(submissionId);
    return { code: 200, msg: 'success', data };
  }

  // ========== 投票 ==========

  @Post('votes')
  async vote(@Body() body: { submission_id: number; user_id: number }) {
    if (!body.submission_id) throw new BadRequestException('提交ID不能为空');
    if (!body.user_id) throw new BadRequestException('用户ID不能为空');
    const data = await this.mvvService.vote(body.submission_id, body.user_id);
    return { code: 200, msg: 'success', data };
  }

  @Delete('votes')
  async unvote(@Body() body: { submission_id: number; user_id: number }) {
    if (!body.submission_id) throw new BadRequestException('提交ID不能为空');
    if (!body.user_id) throw new BadRequestException('用户ID不能为空');
    const data = await this.mvvService.unvote(body.submission_id, body.user_id);
    return { code: 200, msg: 'success', data };
  }

  @Get('votes/user/:userId')
  async getUserVotes(@Param('userId') userId: string) {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) throw new BadRequestException('无效的用户ID');
    const data = await this.mvvService.getUserVotes(uid);
    return { code: 200, msg: 'success', data };
  }

  // ========== 统计 ==========

  @Get('stats')
  async getStats() {
    const data = await this.mvvService.getStats();
    return { code: 200, msg: 'success', data };
  }

  // ========== 讨论消息 ==========

  @Post('messages')
  async sendMessage(
    @Body() body: { user_id: number; content: string; is_anonymous: boolean },
  ) {
    if (!body.user_id) throw new BadRequestException('用户ID不能为空');
    if (!body.content || body.content.trim().length === 0) {
      throw new BadRequestException('消息内容不能为空');
    }
    const data = await this.mvvService.sendMessage(
      body.user_id,
      body.content.trim(),
      body.is_anonymous ?? false,
    );
    return { code: 200, msg: 'success', data };
  }

  @Get('messages')
  async getMessages(
    @Query('limit') limit?: string,
    @Query('before_id') beforeId?: string,
  ) {
    const msgLimit = Math.min(parseInt(limit ?? '50', 10) || 50, 100);
    const before = beforeId ? parseInt(beforeId, 10) : undefined;
    const data = await this.mvvService.getMessages(msgLimit, before);
    const count = await this.mvvService.getMessageCount();
    return { code: 200, msg: 'success', data, total: count };
  }
}