import request from 'supertest';
import { defaultUrl } from '../constants';
import { AuthHelper } from '../helpers/auth.helper';

function emptyStep() {
  return {
    payload: {},
    attachments: [],
    status: 'in-progress',
    currentRound: 0,
    assignedReviewerRole: null,
  };
}

function minimalDraft(hunterId: string, draftId: string) {
  return {
    id: draftId,
    hunterId,
    version: 0,
    aggregateStatus: 'draft',
    meta: {
      ...emptyStep(),
      payload: { reportTitle: 'E2E draft' },
    },
    description: emptyStep(),
    collection: emptyStep(),
    exploitation: emptyStep(),
    proofOfConcept: emptyStep(),
    risks: emptyStep(),
    remediation: emptyStep(),
    final: emptyStep(),
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
  };
}

describe('report-drafts (slice 1)', () => {
  let testUser: Awaited<ReturnType<typeof AuthHelper.createAndLoginUser>>;
  const draftId = `e2e-draft-${Date.now()}`;

  beforeAll(async () => {
    testUser = await AuthHelper.createAndLoginUser();
  });

  afterAll(async () => {
    await AuthHelper.deleteUser(testUser.uid!);
  });

  it('PUT then GET persists a draft for the authenticated hunter', async () => {
    const draft = minimalDraft(testUser.uid!, draftId);

    const putRes = await request(defaultUrl)
      .put('/api/report-drafts')
      .set(AuthHelper.getAuthHeader(testUser.token!))
      .send(draft);

    expect(putRes.status).toBe(200);
    expect(putRes.body).toEqual({ ok: true });

    const getRes = await request(defaultUrl)
      .get(`/api/report-drafts/${draftId}`)
      .set(AuthHelper.getAuthHeader(testUser.token!));

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(draftId);
    expect(getRes.body.hunterId).toBe(testUser.uid);
    expect(getRes.body.meta.payload.reportTitle).toBe('E2E draft');
  });

  it('GET list returns saved draft for hunterId', async () => {
    const listRes = await request(defaultUrl)
      .get('/api/report-drafts')
      .query({ hunterId: testUser.uid })
      .set(AuthHelper.getAuthHeader(testUser.token!));

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((d: { id: string }) => d.id === draftId)).toBe(true);
  });

  it('returns 401 without bearer token', async () => {
    const res = await request(defaultUrl).get(`/api/report-drafts/${draftId}`);
    expect(res.status).toBe(401);
  });
});
