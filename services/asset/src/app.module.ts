import { Module } from '@nestjs/common';
import { AssetsModule } from './modules/assets/assets.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [PrismaModule, AssetsModule],
})
export class AppModule { }
