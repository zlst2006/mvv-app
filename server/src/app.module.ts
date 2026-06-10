import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MvvModule } from '@/modules/mvv/mvv.module';

@Module({
  imports: [MvvModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
