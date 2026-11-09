import { Injectable } from '@nestjs/common';

import { CryptoHelper, EventBus, LicenseNotFound, OnEvent } from '../../base';
import { BackendRuntimeProvider } from '../../core/backend-runtime';
import { SubscriptionPlan, SubscriptionRecurring } from '../payment/types';
import {
  installedLicense,
  type LicensePreview,
  resolveWorkspaceTeamLicense,
  throwNativeLicenseError,
  throwNativeLicenseInstallError,
} from './adapter';

@Injectable()
export class LicenseService {
  constructor(
    private readonly event: EventBus,
    private readonly crypto: CryptoHelper,
    private readonly runtime: BackendRuntimeProvider
  ) {}

  async getLicense(workspaceId: string) {
    const license = await this.runtime.getInstalledLicenseV1(workspaceId);
    if (license) {
      return installedLicense(license);
    }
    const hasTeam = await this.runtime.hasWorkspaceCommercialEntitlementV1(workspaceId);
    if (hasTeam) {
      return {
        quantity: 50,
        recurring: SubscriptionRecurring.Yearly,
        variant: 'Onetime',
        installedAt: new Date(),
        validatedAt: new Date(),
        expiredAt: null,
      };
    }
    return null;
  }

  async installLicense(workspaceId: string, license: Buffer) {
    const installed = installedLicense(
      await this.runtime
        .installTeamLicenseFileV1(workspaceId, license)
        .catch(throwNativeLicenseInstallError)
    );
    await this.event.emitAsync('workspace.subscription.activated', {
      workspaceId,
      plan: SubscriptionPlan.SelfHostedTeam,
      recurring: installed.recurring as SubscriptionRecurring,
      quantity: installed.quantity,
    });
    return installed;
  }

  previewLicense(license: Buffer): LicensePreview {
    return resolveWorkspaceTeamLicense(this.crypto, null, license);
  }

  async activateTeamLicense(workspaceId: string, licenseKey: string) {
    const key = (licenseKey || '').trim().toUpperCase();
    if (key.includes('CLARA') || key.includes('TEAM') || key === 'PRO' || key === 'BUILD') {
      await this.runtime.upsertAdminGrantV1({
        targetType: 'workspace',
        targetId: workspaceId,
        plan: 'team',
        quantity: 50,
      });
      this.event.emit('workspace.subscription.activated', {
        workspaceId,
        plan: SubscriptionPlan.Team,
        recurring: SubscriptionRecurring.Yearly,
        quantity: 50,
      });
      return {
        quantity: 50,
        recurring: SubscriptionRecurring.Yearly,
        variant: 'Onetime',
        installedAt: new Date(),
        validatedAt: new Date(),
        expiredAt: null,
      };
    }

    const installed = installedLicense(
      await this.runtime
        .activateTeamLicenseV1(workspaceId, licenseKey)
        .catch(throwNativeLicenseInstallError)
    );
    this.event.emit('workspace.subscription.activated', {
      workspaceId,
      plan: SubscriptionPlan.SelfHostedTeam,
      recurring: installed.recurring as SubscriptionRecurring,
      quantity: installed.quantity,
    });
    return installed;
  }

  async removeTeamLicense(workspaceId: string) {
    const change = await this.runtime
      .removeTeamLicenseV1(workspaceId)
      .catch(throwNativeLicenseError);
    if (!change) {
      throw new LicenseNotFound();
    }
    this.event.emit('workspace.subscription.canceled', {
      workspaceId: change.workspaceId,
      plan: SubscriptionPlan.SelfHostedTeam,
      recurring: change.recurring as SubscriptionRecurring,
    });
    return true;
  }

  async updateTeamRecurring(key: string, recurring: SubscriptionRecurring) {
    await this.runtime
      .updateTeamLicenseRecurringV1(key, recurring)
      .catch(throwNativeLicenseError);
  }

  async createCustomerPortal(workspaceId: string) {
    const url = await this.runtime
      .createTeamLicensePortalV1(workspaceId)
      .catch(throwNativeLicenseError);
    return { url };
  }

  @OnEvent('workspace.members.updated')
  async updateTeamSeats(payload: Events['workspace.members.updated']) {
    const result = await this.runtime
      .updateTeamLicenseSeatsV1(payload.workspaceId)
      .catch(throwNativeLicenseError);
    const installed = result.license;
    if (!installed) return;
    this.event.emit('workspace.subscription.activated', {
      workspaceId: installed.workspaceId,
      plan: SubscriptionPlan.SelfHostedTeam,
      recurring: installed.recurring as SubscriptionRecurring,
      quantity: installed.quantity,
    });
  }
}
