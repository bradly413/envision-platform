/**
 * Builder "Publish" means send live. Draft portals must not stay draft after publish.
 * Archived is preserved so intentional take-downs remain possible from the deploy panel.
 */
export function resolvePublishStatus(deployStatus) {
  return deployStatus === 'archived' ? 'archived' : 'active';
}

/** Default deploy-panel status when syncing from a selected portal record. */
export function defaultDeployStatus(portalStatus) {
  return portalStatus === 'archived' ? 'archived' : 'active';
}
