import { Module } from '@nestjs/common';
import { MvvController } from './mvv.controller';
import { MvvService } from './mvv.service';

@Module({
  controllers: [MvvController],
  providers: [MvvService],
  exports: [MvvService],
})
export class MvvModule {}