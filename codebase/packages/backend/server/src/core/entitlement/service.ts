import { Injectable } from '@nestjs/common';

import { BadRequest } from '../../base';
import { BackendRuntimeProvider } from '../backend-runtime';

type TargetType = 'user' | 'workspace';

@Injectable()
export class EntitlementService {
  constructor(private readonly runtime: BackendRuntimeProvider) {}

  hasCommercialWorkspace(workspaceId: string) {
    return this.runtime.hasWorkspaceCommercialEntitlementV1(workspaceId);
  }

  async upsertAdminGrant(input: {
    targetType: TargetType;
    targetId: string;
    plan: string;
    quantity?: number | null;
  }) {
    await this.runtime.upsertAdminGrantV1({
      ...input,
      quantity: input.quantity ?? undefined,
    });
  }

  async revokeAdminGrant(targetType: TargetType, targetId: string) {
    await this.runtime.revokeAdminGrantV1(targetType, targetId);
  }
}
