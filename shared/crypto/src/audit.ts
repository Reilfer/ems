
export interface AuditEntry {
    id: string;
    timestamp: string;
    eventType: AuditEventType;
    userId?: string;
    schoolId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    previousHash: string;
    hash: string;
}

export type AuditEventType =
    | 'auth.login'
    | 'auth.logout'
    | 'auth.login_failed'
    | 'auth.password_change'
    | 'auth.2fa_enabled'
    | 'auth.2fa_disabled'
    | 'auth.token_refresh'
    | 'auth.sso_login'
    | 'user.create'
    | 'user.update'
    | 'user.delete'
    | 'user.role_change'
    | 'data.access'
    | 'data.export'
    | 'data.bulk_update'
    | 'data.delete'
    | 'payment.initiated'
    | 'payment.completed'
    | 'payment.refunded'
    | 'grade.modified'
    | 'attendance.override'
    | 'system.backup'
    | 'system.restore'
    | 'system.config_change'
    | 'security.key_rotation'
    | 'security.pqc_key_generated'
    | 'security.suspicious_activity';

export class AuditTrail {
    private lastHash: string = '0'.repeat(64); 

    async createEntry(
        eventType: AuditEventType,
        action: string,
        context: {
            userId?: string;
            schoolId?: string;
            resource?: string;
            resourceId?: string;
            ipAddress?: string;
            userAgent?: string;
            details?: Record<string, any>;
        }
    ): Promise<AuditEntry> {

        throw new Error('Audit trail: Implementation pending');
    }

    async verifyChain(entries: AuditEntry[]): Promise<{
        valid: boolean;
        brokenAt?: number;
        message: string;
    }> {

        throw new Error('Audit chain verification: Implementation pending');
    }

    async query(filters: {
        userId?: string;
        schoolId?: string;
        eventType?: AuditEventType;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditEntry[]> {
        throw new Error('Audit query: Implementation pending');
    }
}

export interface EncryptionConfig {
    algorithm: 'AES-256-GCM';
    pqcEnabled: boolean;
    keyRotationDays: number;
    hybridMode: boolean;           
    fieldsToEncrypt: string[];     
}

export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
    algorithm: 'AES-256-GCM',
    pqcEnabled: true,
    keyRotationDays: 90,
    hybridMode: true,
    fieldsToEncrypt: [
        'password_hash',
        'two_factor_secret',
        'face_encoding',
        'medical_notes',
        'bank_account',
        'national_id',
    ],
};

export interface BackupConfig {
    enabled: boolean;
    schedule: string;              
    retentionDays: number;
    encryptBackups: boolean;       
    destinations: BackupDestination[];
}

export interface BackupDestination {
    type: 'local' | 's3' | 'gcs' | 'azure_blob';
    path: string;
    credentials?: Record<string, string>;
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
    enabled: true,
    schedule: '0 2 * * *',        
    retentionDays: 30,
    encryptBackups: true,
    destinations: [
        { type: 'local', path: '/backups' },
    ],
};
