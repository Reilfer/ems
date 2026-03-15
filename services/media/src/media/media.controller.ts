import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import type { Response } from 'express';

@ApiTags('media')
@Controller()
export class MediaController {
    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            filename: file.filename,
            originalName: file.originalname,
            url: `http://localhost:3013/uploads/${file.filename}`, 
            size: file.size
        };
    }
}
