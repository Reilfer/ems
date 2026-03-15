import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, CreateMaintenanceDto } from './assets.dto';

export interface AssetRecord {
    id: string; schoolId: string; code: string; name: string;
    category: string; location: string; condition: string;
    purchasePrice: number; createdAt: string;
}

export interface MaintenanceRecord {
    id: string; schoolId: string; assetId: string; title: string;
    description: string; priority: string; status: string;
    requestedBy: string; createdAt: string;
}

@Injectable()
export class AssetsService {
    constructor(private prisma: PrismaService) { }

    private assets: AssetRecord[] = [
        { id: 'ast-1', schoolId: 'school-001', code: 'PROJ-01', name: 'Projector Sony X1', category: 'electronics', location: 'Room 101', condition: 'good', purchasePrice: 500, createdAt: new Date().toISOString() },
        { id: 'ast-2', schoolId: 'school-001', code: 'DESK-01', name: 'Teacher Desk', category: 'furniture', location: 'Room 101', condition: 'new', purchasePrice: 150, createdAt: new Date().toISOString() },
    ];

    private requests: MaintenanceRecord[] = [];

    async findAll() {
        return this.assets;
    }

    async findById(id: string) {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) throw new NotFoundException(`Asset ${id} not found`);
        return asset;
    }

    async create(dto: CreateAssetDto) {
        const newAsset: AssetRecord = {
            id: `ast-${Date.now()}`,
            schoolId: dto.schoolId,
            code: dto.code,
            name: dto.name,
            category: dto.category,
            location: dto.location || 'Unknown',
            condition: 'new',
            purchasePrice: dto.purchasePrice || 0,
            createdAt: new Date().toISOString()
        };
        this.assets.push(newAsset);
        return newAsset;
    }

    async update(id: string, dto: UpdateAssetDto) {
        const asset = this.assets.find(a => a.id === id);
        if (asset) {
            Object.assign(asset, dto);
            return asset;
        }
        return { id, ...dto }; 
    }

    async createMaintenanceRequest(dto: CreateMaintenanceDto) {
        const newReq: MaintenanceRecord = {
            id: `maint-${Date.now()}`,
            schoolId: dto.schoolId,
            assetId: dto.assetId,
            title: dto.title,
            description: dto.description || '',
            priority: dto.priority,
            status: 'open',
            requestedBy: dto.requestedBy,
            createdAt: new Date().toISOString()
        };
        this.requests.push(newReq);
        return newReq;
    }

    async getMaintenanceRequests() {
        return this.requests;
    }
}
