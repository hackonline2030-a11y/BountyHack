Ici des refactor à faire à la fin qui concernent les mocks et les tests : 

```bash
pnpm exec nx run web-api:test --testPathPattern "report-(draft|team|shared)"

> nx run web-api:test --testPathPattern report-(draft|team|shared)

 PASS   web-api  src/report-draft/application/mappers/report-draft-to-final-validation-summary.mapper.spec.ts (5.138 s)
 PASS   web-api  src/report-draft/application/report-draft-reviewer-sync.spec.ts (5.218 s)
 PASS   web-api  src/report-team/application/role-validity.engine.spec.ts
 PASS   web-api  src/report-draft/application/attachments/report-draft-image-storage.spec.ts (5.412 s)
 FAIL   web-api  src/report-draft/application/queries/list-submissions.query.spec.ts
  ● Test suite failed to run

    src/report-draft/application/queries/list-submissions.query.spec.ts:47:9 - error TS2322: Type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' is not assignable to type 'Mocked<IReportDraftRepository>'.
      Property 'updatePrimaryHunterId' is missing in type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' but required in type '{ save: MockInstance<Promise<void>, [draft: ReportDraftWire], unknown>; updateHunterWriterId: MockInstance<Promise<void>, [draftId: string, hunterWriterId: string], unknown>; ... 7 more ...; deleteById: MockInstance<...>; }'.

    47   const reportDraftRepository: jest.Mocked<IReportDraftRepository> = {
               ~~~~~~~~~~~~~~~~~~~~~

      src/report-draft/ports/report-draft-repository.interface.ts:12:3
        12   updatePrimaryHunterId(draftId: string, hunterId: string): Promise<void>;
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        'updatePrimaryHunterId' is declared here.
    src/report-draft/application/queries/list-submissions.query.spec.ts:71:18 - error TS2554: Expected 4 arguments, but got 3.

     71   const access = new ReportDraftAccessPolicy(
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     72     reportDraftRepository,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~
    ... 
     74     reportTeamRepository as unknown as IReportTeamRepository,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     75   );
        ~~~

      src/report-draft/application/report-draft-access.policy.ts:23:5
        23     private readonly userRepository: IUserRepository,
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        An argument for 'userRepository' was not provided.

 FAIL   web-api  src/report-draft/application/commands/save-reviewer-comments.command.spec.ts
  ● Test suite failed to run

    src/report-draft/application/commands/save-reviewer-comments.command.spec.ts:28:9 - error TS2322: Type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' is not assignable to type 'Mocked<IReportDraftRepository>'.
      Property 'updatePrimaryHunterId' is missing in type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' but required in type '{ save: MockInstance<Promise<void>, [draft: ReportDraftWire], unknown>; updateHunterWriterId: MockInstance<Promise<void>, [draftId: string, hunterWriterId: string], unknown>; ... 7 more ...; deleteById: MockInstance<...>; }'.

    28   const reportDraftRepository: jest.Mocked<IReportDraftRepository> = {
               ~~~~~~~~~~~~~~~~~~~~~

      src/report-draft/ports/report-draft-repository.interface.ts:12:3
        12   updatePrimaryHunterId(draftId: string, hunterId: string): Promise<void>;
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        'updatePrimaryHunterId' is declared here.
    src/report-draft/application/commands/save-reviewer-comments.command.spec.ts:54:18 - error TS2554: Expected 4 arguments, but got 3.

     54   const access = new ReportDraftAccessPolicy(
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     55     reportDraftRepository,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~
    ... 
     57     reportTeamRepository as never,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     58   );
        ~~~

      src/report-draft/application/report-draft-access.policy.ts:23:5
        23     private readonly userRepository: IUserRepository,
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        An argument for 'userRepository' was not provided.

 PASS   web-api  src/report-draft/adapters/postgre-prisma/submission-prisma.mapper.spec.ts (5.623 s)
 PASS   web-api  src/report-draft/application/admin/promote-draft-to-report.spec.ts
 PASS   web-api  src/report-draft/adapters/postgre-prisma/report-draft-enum.mapper.spec.ts
 FAIL   web-api  src/report-draft/application/report-draft-access.policy.spec.ts
  ● Test suite failed to run

    src/report-draft/application/report-draft-access.policy.spec.ts:496:54 - error TS2345: Argument of type '{ uid: string; username: string; email: null; roleCode: AppRoleCode.HUNTER; }' is not assignable to parameter of type 'UserAdminSummary | Promise<UserAdminSummary>'.
      Type '{ uid: string; username: string; email: null; roleCode: AppRoleCode.HUNTER; }' is missing the following properties from type 'UserAdminSummary': accountStatus, isFakeUser

    496     userRepository.findSummaryById.mockResolvedValue({
                                                             ~
    497       uid: 'hunter-2',
        ~~~~~~~~~~~~~~~~~~~~~~
    ... 
    500       roleCode: AppRoleCode.HUNTER,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    501     });
        ~~~~~
    src/report-draft/application/report-draft-access.policy.spec.ts:517:54 - error TS2345: Argument of type '{ uid: string; username: string; email: null; roleCode: AppRoleCode.QUALITY_CHECKER; }' is not assignable to parameter of type 'UserAdminSummary | Promise<UserAdminSummary>'.
      Type '{ uid: string; username: string; email: null; roleCode: AppRoleCode.QUALITY_CHECKER; }' is missing the following properties from type 'UserAdminSummary': accountStatus, isFakeUser

    517     userRepository.findSummaryById.mockResolvedValue({
                                                             ~
    518       uid: 'qc-1',
        ~~~~~~~~~~~~~~~~~~
    ... 
    521       roleCode: AppRoleCode.QUALITY_CHECKER,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    522     });
        ~~~~~

 FAIL   web-api  src/report-draft/application/queries/list-report-drafts-for-final-validation.query.spec.ts
  ● Test suite failed to run

    src/report-draft/application/queries/list-report-drafts-for-final-validation.query.spec.ts:6:9 - error TS2322: Type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' is not assignable to type 'Mocked<IReportDraftRepository>'.
      Property 'updatePrimaryHunterId' is missing in type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' but required in type '{ save: MockInstance<Promise<void>, [draft: ReportDraftWire], unknown>; updateHunterWriterId: MockInstance<Promise<void>, [draftId: string, hunterWriterId: string], unknown>; ... 7 more ...; deleteById: MockInstance<...>; }'.

    6   const repository: jest.Mocked<IReportDraftRepository> = {
              ~~~~~~~~~~

      src/report-draft/ports/report-draft-repository.interface.ts:12:3
        12   updatePrimaryHunterId(draftId: string, hunterId: string): Promise<void>;
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        'updatePrimaryHunterId' is declared here.

 FAIL   web-api  src/report-draft/application/commands/save-report-draft.command.spec.ts
  ● Test suite failed to run

    src/report-draft/application/commands/save-report-draft.command.spec.ts:38:9 - error TS2322: Type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' is not assignable to type 'Mocked<IReportDraftRepository>'.
      Property 'updatePrimaryHunterId' is missing in type '{ save: jest.Mock<any, any, any>; updateHunterWriterId: jest.Mock<any, any, any>; findById: jest.Mock<any, any, any>; findByHunterId: jest.Mock<any, any, any>; ... 4 more ...; deleteById: jest.Mock<...>; }' but required in type '{ save: MockInstance<Promise<void>, [draft: ReportDraftWire], unknown>; updateHunterWriterId: MockInstance<Promise<void>, [draftId: string, hunterWriterId: string], unknown>; ... 7 more ...; deleteById: MockInstance<...>; }'.

    38   const reportDraftRepository: jest.Mocked<IReportDraftRepository> = {
               ~~~~~~~~~~~~~~~~~~~~~

      src/report-draft/ports/report-draft-repository.interface.ts:12:3
        12   updatePrimaryHunterId(draftId: string, hunterId: string): Promise<void>;
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        'updatePrimaryHunterId' is declared here.
    src/report-draft/application/commands/save-report-draft.command.spec.ts:64:18 - error TS2554: Expected 4 arguments, but got 3.

     64   const access = new ReportDraftAccessPolicy(
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     65     reportDraftRepository,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~
    ... 
     67     reportTeamRepository as never,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     68   );
        ~~~

      src/report-draft/application/report-draft-access.policy.ts:23:5
        23     private readonly userRepository: IUserRepository,
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        An argument for 'userRepository' was not provided.

 PASS   web-api  src/report-draft/application/queries/list-orphan-report-drafts.query.spec.ts
 PASS   web-api  src/report-team/application/report-team-validity.spec.ts
 PASS   web-api  src/report-draft/application/queries/get-report-draft-by-id.query.spec.ts (6.766 s)
 PASS   web-api  src/report-draft/adapters/postgre-prisma/report-draft-prisma.mapper.spec.ts (6.914 s)
 PASS   web-api  src/report-team/application/report-team-member-role-from-app-role.spec.ts
 PASS   web-api  src/report-draft/application/commands/delete-report-draft.command.spec.ts
 PASS   web-api  src/report-draft/controllers/report-draft.controller.spec.ts (7.931 s)

Test Suites: 5 failed, 14 passed, 19 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        8.557 s
Ran all test suites matching /report-(draft|team|shared)/i.

————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 NX   Ran target test for project web-api (10s)

      With additional flags:
        --testPathPattern=report-(draft|team|shared)

   ✖  1/1 failed
   ✔  0/1 succeeded [0 read from cache]

```