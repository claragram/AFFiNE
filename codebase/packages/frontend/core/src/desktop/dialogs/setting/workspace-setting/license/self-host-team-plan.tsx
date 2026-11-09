import { Button, notify } from '@affine/component';
import { SelfhostLicenseService } from '@affine/core/modules/cloud';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import { DoneIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import * as styles from './self-host-team-plan.css';

const initialQuota = '100 GB';
const quotaPerSeat = '20 GB';
const maxFileSize = '500 MB';

export const SelfHostTeamPlan = () => {
  const t = useI18n();

  const workspace = useService(WorkspaceService).workspace;
  const selfhostLicenseService = useService(SelfhostLicenseService);
  const permission = useService(WorkspacePermissionService).permission;
  const isTeam = useLiveData(permission.isTeam$);
  const [loading, setLoading] = useState(false);

  const handleBuildTeam = useCallback(() => {
    setLoading(true);
    selfhostLicenseService
      .activateLicense(workspace.id, 'CLARANOTE-TEAM')
      .then(() => {
        setLoading(false);
        permission.revalidate();
        notify.success({
          title: 'Claranote Team Workspace Activated!',
          message:
            'Multi-user real-time collaboration and 50 team seats enabled.',
        });
      })
      .catch((e: any) => {
        setLoading(false);
        notify.error({
          title: 'Team Activation Failed',
          message: String(e?.message || e),
        });
      });
  }, [permission, selfhostLicenseService, workspace.id]);

  if (isTeam) {
    return null;
  }

  return (
    <div className={styles.pricingPlan}>
      <div className={styles.planCardHeader}>
        <div className={styles.planCardTitle}>
          {t['com.affine.settings.workspace.license.benefit.team.title']()}
        </div>
        <div className={styles.planCardSubtitle}>
          {t['com.affine.settings.workspace.license.benefit.team.subtitle']()}
        </div>
      </div>

      <div className={styles.benefitItems}>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g1']()}
        </div>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g2']({
            initialQuota,
            quotaPerSeat,
          })}
        </div>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g3']({
            quota: maxFileSize,
          })}
        </div>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g4']()}
        </div>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g5']()}
        </div>
        <div className={styles.benefitItem}>
          <DoneIcon className={styles.doneIconStyle} />
          {t['com.affine.settings.workspace.license.benefit.team.g6']()}
        </div>
      </div>

      <div className={styles.leanMoreButtonContainer}>
        <Button
          variant="primary"
          loading={loading}
          onClick={handleBuildTeam}
        >
          Build Claranote Team Workspace (50 Seats)
        </Button>
      </div>
    </div>
  );
};
