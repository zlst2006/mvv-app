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

  @Post('users')
  async createUser(@Body() body: { nickname: string }) {
    if (!body.nickname || body.nickname.trim().length === 0) {
      throw new BadRequestException('昵称不能为空');
    }
    if (body.nickname.length > 50) {
      throw new BadRequestException('昵称不能超过50个字符');
    }
    const data = await this.mvvService.createUser(body.nickname.trim());
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
}