/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/task_escrow.json`.
 */
export type TaskEscrow = {
  address: 'FL4r4cpufpsdbhxLe4Gr3CMpPxAyeAu7WgRZHGb21Tor'
  metadata: {
    name: 'taskEscrow'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Verbitto Task Settlement — SOL escrow, disputes, templates'
  }
  instructions: [
    {
      name: 'approveAndSettle'
      discriminator: [149, 210, 18, 168, 18, 3, 209, 224]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
          signer: true
        },
        {
          name: 'agent'
          writable: true
        },
        {
          name: 'agentProfile'
          docs: ["Agent's on-chain profile. Updated with completion stats."]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'task.agent'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'treasury'
          writable: true
        },
      ]
      args: []
    },
    {
      name: 'cancelTask'
      discriminator: [69, 228, 134, 187, 134, 105, 238, 48]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
          signer: true
        },
      ]
      args: []
    },
    {
      name: 'castVote'
      discriminator: [20, 212, 15, 189, 69, 180, 69, 151]
      accounts: [
        {
          name: 'task'
          docs: ['Task account referenced by the dispute. Used to verify voter is not a party.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'dispute'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [100, 105, 115, 112, 117, 116, 101]
              },
              {
                kind: 'account'
                path: 'task'
              },
            ]
          }
        },
        {
          name: 'platform'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'vote'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [118, 111, 116, 101]
              },
              {
                kind: 'account'
                path: 'dispute'
              },
              {
                kind: 'account'
                path: 'voter'
              },
            ]
          }
        },
        {
          name: 'voterProfile'
          docs: ['Voter must have a registered agent profile (sybil protection).']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'voter'
              },
            ]
          }
        },
        {
          name: 'voter'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'ruling'
          type: {
            defined: {
              name: 'ruling'
            }
          }
        },
      ]
    },
    {
      name: 'claimTask'
      discriminator: [49, 222, 219, 238, 155, 68, 221, 136]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'platform'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'agentProfile'
          docs: ['Agent must have a registered profile to claim tasks.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'agent'
              },
            ]
          }
        },
        {
          name: 'agent'
          signer: true
        },
      ]
      args: []
    },
    {
      name: 'createTask'
      discriminator: [194, 80, 6, 180, 232, 127, 48, 171]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'creator'
              },
              {
                kind: 'arg'
                path: 'taskIndex'
              },
            ]
          }
        },
        {
          name: 'creatorCounter'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 114, 101, 97, 116, 111, 114]
              },
              {
                kind: 'account'
                path: 'creator'
              },
            ]
          }
        },
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'title'
          type: 'string'
        },
        {
          name: 'descriptionHash'
          type: {
            array: ['u8', 32]
          }
        },
        {
          name: 'bountyLamports'
          type: 'u64'
        },
        {
          name: 'taskIndex'
          type: 'u64'
        },
        {
          name: 'deadline'
          type: 'i64'
        },
        {
          name: 'reputationReward'
          type: 'i64'
        },
      ]
    },
    {
      name: 'createTaskFromTemplate'
      discriminator: [201, 88, 188, 163, 6, 21, 239, 202]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'creator'
              },
              {
                kind: 'arg'
                path: 'taskIndex'
              },
            ]
          }
        },
        {
          name: 'creatorCounter'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 114, 101, 97, 116, 111, 114]
              },
              {
                kind: 'account'
                path: 'creator'
              },
            ]
          }
        },
        {
          name: 'template'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 101, 109, 112, 108, 97, 116, 101]
              },
              {
                kind: 'account'
                path: 'template.creator'
                account: 'taskTemplate'
              },
              {
                kind: 'account'
                path: 'template.template_index'
                account: 'taskTemplate'
              },
            ]
          }
        },
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'bountyLamports'
          type: 'u64'
        },
        {
          name: 'deadline'
          type: 'i64'
        },
        {
          name: 'reputationReward'
          type: 'i64'
        },
        {
          name: 'taskIndex'
          type: 'u64'
        },
        {
          name: 'descriptionHash'
          type: {
            array: ['u8', 32]
          }
        },
      ]
    },
    {
      name: 'createTemplate'
      discriminator: [245, 51, 247, 234, 31, 9, 40, 227]
      accounts: [
        {
          name: 'template'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 101, 109, 112, 108, 97, 116, 101]
              },
              {
                kind: 'account'
                path: 'creator'
              },
              {
                kind: 'account'
                path: 'platform.template_count'
                account: 'platform'
              },
            ]
          }
        },
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'title'
          type: 'string'
        },
        {
          name: 'descriptionHash'
          type: {
            array: ['u8', 32]
          }
        },
        {
          name: 'defaultBountyLamports'
          type: 'u64'
        },
        {
          name: 'category'
          type: {
            defined: {
              name: 'taskCategory'
            }
          }
        },
      ]
    },
    {
      name: 'deactivateTemplate'
      discriminator: [161, 89, 173, 13, 150, 247, 106, 194]
      accounts: [
        {
          name: 'template'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 101, 109, 112, 108, 97, 116, 101]
              },
              {
                kind: 'account'
                path: 'template.creator'
                account: 'taskTemplate'
              },
              {
                kind: 'account'
                path: 'template.template_index'
                account: 'taskTemplate'
              },
            ]
          }
        },
        {
          name: 'platform'
          docs: ['Platform config (needed for pause check).']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          signer: true
          relations: ['template']
        },
      ]
      args: []
    },
    {
      name: 'expireTask'
      discriminator: [116, 94, 206, 205, 170, 51, 156, 98]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
        },
        {
          name: 'platform'
          docs: ['Platform config (needed for claim_grace_period).']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'caller'
          docs: ['Anyone can trigger expiration.']
          signer: true
        },
      ]
      args: []
    },
    {
      name: 'initializePlatform'
      discriminator: [119, 201, 101, 45, 75, 122, 89, 3]
      accounts: [
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'treasury'
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'feeBps'
          type: 'u16'
        },
        {
          name: 'minBountyLamports'
          type: 'u64'
        },
        {
          name: 'disputeVotingPeriod'
          type: 'i64'
        },
        {
          name: 'disputeMinVotes'
          type: 'u8'
        },
        {
          name: 'minVoterReputation'
          type: 'i64'
        },
        {
          name: 'claimGracePeriod'
          type: 'i64'
        },
      ]
    },
    {
      name: 'openDispute'
      discriminator: [137, 25, 99, 119, 23, 223, 161, 42]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'dispute'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [100, 105, 115, 112, 117, 116, 101]
              },
              {
                kind: 'account'
                path: 'task'
              },
            ]
          }
        },
        {
          name: 'initiator'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'reason'
          type: {
            defined: {
              name: 'disputeReason'
            }
          }
        },
        {
          name: 'evidenceHash'
          type: {
            array: ['u8', 32]
          }
        },
      ]
    },
    {
      name: 'pausePlatform'
      discriminator: [232, 46, 204, 130, 181, 0, 172, 57]
      accounts: [
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'authority'
          signer: true
          relations: ['platform']
        },
      ]
      args: []
    },
    {
      name: 'reactivateTemplate'
      discriminator: [64, 124, 193, 132, 206, 157, 140, 75]
      accounts: [
        {
          name: 'template'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 101, 109, 112, 108, 97, 116, 101]
              },
              {
                kind: 'account'
                path: 'template.creator'
                account: 'taskTemplate'
              },
              {
                kind: 'account'
                path: 'template.template_index'
                account: 'taskTemplate'
              },
            ]
          }
        },
        {
          name: 'platform'
          docs: ['Platform config (needed for pause check).']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          signer: true
          relations: ['template']
        },
      ]
      args: []
    },
    {
      name: 'registerAgent'
      discriminator: [135, 157, 66, 195, 2, 113, 175, 30]
      accounts: [
        {
          name: 'agentProfile'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'authority'
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'skillTags'
          type: 'u8'
        },
      ]
    },
    {
      name: 'rejectSubmission'
      discriminator: [2, 92, 1, 81, 148, 156, 6, 160]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'creator'
          signer: true
        },
      ]
      args: [
        {
          name: 'reasonHash'
          type: {
            array: ['u8', 32]
          }
        },
      ]
    },
    {
      name: 'resolveDispute'
      discriminator: [231, 6, 202, 6, 96, 103, 12, 230]
      accounts: [
        {
          name: 'dispute'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [100, 105, 115, 112, 117, 116, 101]
              },
              {
                kind: 'account'
                path: 'task'
              },
            ]
          }
        },
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'creator'
          writable: true
        },
        {
          name: 'agent'
          writable: true
        },
        {
          name: 'agentProfile'
          docs: ["Agent's on-chain profile. Updated with dispute outcome."]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'task.agent'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'treasury'
          writable: true
        },
        {
          name: 'caller'
          docs: ['Anyone can trigger dispute resolution after voting period.']
          signer: true
        },
      ]
      args: []
    },
    {
      name: 'resumePlatform'
      discriminator: [23, 162, 56, 123, 186, 207, 109, 131]
      accounts: [
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'authority'
          signer: true
          relations: ['platform']
        },
      ]
      args: []
    },
    {
      name: 'submitDeliverable'
      discriminator: [38, 137, 64, 44, 237, 11, 125, 101]
      accounts: [
        {
          name: 'task'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 97, 115, 107]
              },
              {
                kind: 'account'
                path: 'task.creator'
                account: 'task'
              },
              {
                kind: 'account'
                path: 'task.task_index'
                account: 'task'
              },
            ]
          }
        },
        {
          name: 'platform'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'agent'
          signer: true
        },
      ]
      args: [
        {
          name: 'deliverableHash'
          type: {
            array: ['u8', 32]
          }
        },
      ]
    },
    {
      name: 'updateAgentSkills'
      discriminator: [85, 199, 126, 131, 237, 98, 184, 64]
      accounts: [
        {
          name: 'agentProfile'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [97, 103, 101, 110, 116]
              },
              {
                kind: 'account'
                path: 'authority'
              },
            ]
          }
        },
        {
          name: 'authority'
          signer: true
          relations: ['agentProfile']
        },
      ]
      args: [
        {
          name: 'skillTags'
          type: 'u8'
        },
      ]
    },
    {
      name: 'updatePlatform'
      discriminator: [46, 78, 138, 189, 47, 163, 120, 85]
      accounts: [
        {
          name: 'platform'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 108, 97, 116, 102, 111, 114, 109]
              },
            ]
          }
        },
        {
          name: 'authority'
          signer: true
          relations: ['platform']
        },
      ]
      args: [
        {
          name: 'feeBps'
          type: 'u16'
        },
        {
          name: 'minBountyLamports'
          type: 'u64'
        },
        {
          name: 'disputeVotingPeriod'
          type: 'i64'
        },
        {
          name: 'disputeMinVotes'
          type: 'u8'
        },
        {
          name: 'minVoterReputation'
          type: 'i64'
        },
        {
          name: 'claimGracePeriod'
          type: 'i64'
        },
        {
          name: 'treasury'
          type: 'pubkey'
        },
      ]
    },
  ]
  accounts: [
    {
      name: 'agentProfile'
      discriminator: [60, 227, 42, 24, 0, 87, 86, 205]
    },
    {
      name: 'arbitratorVote'
      discriminator: [12, 102, 2, 171, 197, 209, 33, 66]
    },
    {
      name: 'creatorCounter'
      discriminator: [62, 129, 78, 26, 23, 138, 248, 82]
    },
    {
      name: 'dispute'
      discriminator: [36, 49, 241, 67, 40, 36, 241, 74]
    },
    {
      name: 'platform'
      discriminator: [77, 92, 204, 58, 187, 98, 91, 12]
    },
    {
      name: 'task'
      discriminator: [79, 34, 229, 55, 88, 90, 55, 84]
    },
    {
      name: 'taskTemplate'
      discriminator: [254, 91, 117, 85, 27, 252, 247, 172]
    },
  ]
  events: [
    {
      name: 'agentProfileUpdated'
      discriminator: [37, 86, 36, 71, 59, 237, 6, 247]
    },
    {
      name: 'agentRegistered'
      discriminator: [191, 78, 217, 54, 232, 100, 189, 85]
    },
    {
      name: 'deliverableSubmitted'
      discriminator: [128, 198, 110, 44, 67, 73, 255, 99]
    },
    {
      name: 'disputeOpened'
      discriminator: [239, 222, 102, 235, 193, 85, 1, 214]
    },
    {
      name: 'disputeResolved'
      discriminator: [121, 64, 249, 153, 139, 128, 236, 187]
    },
    {
      name: 'platformInitialized'
      discriminator: [16, 222, 212, 5, 213, 140, 112, 162]
    },
    {
      name: 'submissionRejected'
      discriminator: [222, 120, 204, 232, 51, 196, 71, 146]
    },
    {
      name: 'taskCancelled'
      discriminator: [158, 101, 220, 187, 16, 141, 141, 64]
    },
    {
      name: 'taskClaimed'
      discriminator: [208, 90, 243, 116, 80, 15, 228, 202]
    },
    {
      name: 'taskCreated'
      discriminator: [49, 174, 6, 7, 71, 159, 69, 175]
    },
    {
      name: 'taskExpired'
      discriminator: [36, 130, 189, 154, 110, 249, 231, 45]
    },
    {
      name: 'taskSettled'
      discriminator: [161, 220, 91, 215, 23, 253, 247, 65]
    },
    {
      name: 'templateCreated'
      discriminator: [182, 124, 104, 44, 8, 70, 124, 46]
    },
    {
      name: 'voteCast'
      discriminator: [39, 53, 195, 104, 188, 17, 225, 213]
    },
  ]
  errors: [
    {
      code: 6000
      name: 'invalidFee'
      msg: 'Fee basis points must be ≤ 3001 (30%)'
    },
    {
      code: 6001
      name: 'invalidConfig'
      msg: 'Invalid platform configuration'
    },
    {
      code: 6002
      name: 'bountyTooLow'
      msg: 'Bounty is below the platform minimum'
    },
    {
      code: 6003
      name: 'titleTooLong'
      msg: 'Title exceeds 64 characters'
    },
    {
      code: 6004
      name: 'deadlineInPast'
      msg: 'Deadline must be in the future'
    },
    {
      code: 6005
      name: 'invalidRepReward'
      msg: 'Reputation reward must be 0–1000'
    },
    {
      code: 6006
      name: 'taskNotOpen'
      msg: 'Task is not in Open status'
    },
    {
      code: 6007
      name: 'taskExpired'
      msg: 'Task has passed its deadline'
    },
    {
      code: 6008
      name: 'taskNotClaimedOrRejected'
      msg: 'Task is not in Claimed or Rejected status'
    },
    {
      code: 6009
      name: 'notAssignedAgent'
      msg: 'Caller is not the assigned agent'
    },
    {
      code: 6010
      name: 'taskNotSubmitted'
      msg: 'Task is not in Submitted status'
    },
    {
      code: 6011
      name: 'notTaskCreator'
      msg: 'Caller is not the task creator'
    },
    {
      code: 6012
      name: 'deadlineNotReached'
      msg: 'Deadline has not been reached yet'
    },
    {
      code: 6013
      name: 'taskCannotExpire'
      msg: 'Task cannot be expired in its current status'
    },
    {
      code: 6014
      name: 'templateInactive'
      msg: 'Template is not active'
    },
    {
      code: 6015
      name: 'taskNotDisputable'
      msg: 'Task is not in a disputable status'
    },
    {
      code: 6016
      name: 'notTaskParty'
      msg: 'Caller is not a party to this task'
    },
    {
      code: 6017
      name: 'disputeNotOpen'
      msg: 'Dispute is not open'
    },
    {
      code: 6018
      name: 'taskNotDisputed'
      msg: 'Task is not in Disputed status'
    },
    {
      code: 6019
      name: 'invalidRuling'
      msg: 'Invalid ruling value'
    },
    {
      code: 6020
      name: 'votingPeriodEnded'
      msg: 'Voting period has ended'
    },
    {
      code: 6021
      name: 'votingPeriodNotEnded'
      msg: 'Voting period has not ended yet'
    },
    {
      code: 6022
      name: 'partyCannotVote'
      msg: 'Task parties cannot vote on their own dispute'
    },
    {
      code: 6023
      name: 'insufficientVotes'
      msg: 'Insufficient votes to resolve dispute'
    },
    {
      code: 6024
      name: 'disputeTaskMismatch'
      msg: 'Dispute does not reference this task'
    },
    {
      code: 6025
      name: 'invalidTreasury'
      msg: 'Treasury account does not match platform config'
    },
    {
      code: 6026
      name: 'notProfileOwner'
      msg: 'Caller is not the profile owner'
    },
    {
      code: 6027
      name: 'insufficientReputation'
      msg: 'Voter reputation is below the minimum required to vote'
    },
    {
      code: 6028
      name: 'platformPaused'
      msg: 'Platform is paused'
    },
    {
      code: 6029
      name: 'platformAlreadyPaused'
      msg: 'Platform is already paused'
    },
    {
      code: 6030
      name: 'platformNotPaused'
      msg: 'Platform is not paused'
    },
    {
      code: 6031
      name: 'notPlatformAuthority'
      msg: 'Caller is not the platform authority'
    },
    {
      code: 6032
      name: 'arithmeticOverflow'
      msg: 'Arithmetic overflow in calculation'
    },
    {
      code: 6033
      name: 'maxRejectionsReached'
      msg: 'Maximum rejection limit reached — task auto-disputed'
    },
    {
      code: 6034
      name: 'invalidTaskIndex'
      msg: 'Task index does not match creator counter'
    },
    {
      code: 6035
      name: 'templateAlreadyActive'
      msg: 'Template is already active'
    },
  ]
  types: [
    {
      name: 'agentProfile'
      docs: ['On-chain agent identity and reputation profile.', 'PDA: [b"agent", authority]']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            docs: ['Agent wallet (signer authority)']
            type: 'pubkey'
          },
          {
            name: 'reputationScore'
            docs: ['Cumulative reputation score (can go negative)']
            type: 'i64'
          },
          {
            name: 'tasksCompleted'
            docs: ['Total tasks successfully completed']
            type: 'u64'
          },
          {
            name: 'tasksDisputed'
            docs: ['Total tasks that went to dispute']
            type: 'u64'
          },
          {
            name: 'disputesWon'
            docs: ['Disputes where agent won']
            type: 'u64'
          },
          {
            name: 'disputesLost'
            docs: ['Disputes where agent lost']
            type: 'u64'
          },
          {
            name: 'totalEarnedLamports'
            docs: ['Total SOL earned (lamports)']
            type: 'u64'
          },
          {
            name: 'registeredAt'
            docs: ['Registration timestamp']
            type: 'i64'
          },
          {
            name: 'skillTags'
            docs: ['Skill bitmap (bit 0=DataLabeling, 1=LiteratureReview, ..., 6=Other)']
            type: 'u8'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'agentProfileUpdated'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'reputationScore'
            type: 'i64'
          },
          {
            name: 'tasksCompleted'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'agentRegistered'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'profile'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'arbitratorVote'
      docs: ['Individual arbitrator vote on a dispute.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'dispute'
            docs: ['Dispute being voted on']
            type: 'pubkey'
          },
          {
            name: 'arbitrator'
            docs: ["Voter's pubkey"]
            type: 'pubkey'
          },
          {
            name: 'ruling'
            docs: ["Voter's ruling"]
            type: {
              defined: {
                name: 'ruling'
              }
            }
          },
          {
            name: 'votedAt'
            docs: ['When vote was cast']
            type: 'i64'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'creatorCounter'
      docs: [
        'Per-creator task counter to eliminate global task_count contention.',
        'PDA: [b"creator", authority]',
      ]
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            docs: ['Creator wallet']
            type: 'pubkey'
          },
          {
            name: 'taskCount'
            docs: ['Creator-local sequential task counter']
            type: 'u64'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'deliverableSubmitted'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'deliverableHash'
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'dispute'
      docs: ['Dispute record for a task.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            docs: ['Task being disputed']
            type: 'pubkey'
          },
          {
            name: 'initiator'
            docs: ['Who opened the dispute']
            type: 'pubkey'
          },
          {
            name: 'reason'
            docs: ['Reason category']
            type: {
              defined: {
                name: 'disputeReason'
              }
            }
          },
          {
            name: 'evidenceHash'
            docs: ['Evidence content hash']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'status'
            docs: ['Current dispute status']
            type: {
              defined: {
                name: 'disputeStatus'
              }
            }
          },
          {
            name: 'votesForCreator'
            docs: ['Votes for creator wins']
            type: 'u16'
          },
          {
            name: 'votesForAgent'
            docs: ['Votes for agent wins']
            type: 'u16'
          },
          {
            name: 'votesForSplit'
            docs: ['Votes for 50/50 split']
            type: 'u16'
          },
          {
            name: 'openedAt'
            docs: ['When dispute was opened']
            type: 'i64'
          },
          {
            name: 'resolvedAt'
            docs: ['When dispute was resolved (0 if open)']
            type: 'i64'
          },
          {
            name: 'ruling'
            docs: ['Final ruling']
            type: {
              defined: {
                name: 'ruling'
              }
            }
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'disputeOpened'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'dispute'
            type: 'pubkey'
          },
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'initiator'
            type: 'pubkey'
          },
          {
            name: 'reason'
            type: {
              defined: {
                name: 'disputeReason'
              }
            }
          },
        ]
      }
    },
    {
      name: 'disputeReason'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'qualityIssue'
          },
          {
            name: 'deadlineMissed'
          },
          {
            name: 'plagiarism'
          },
          {
            name: 'other'
          },
        ]
      }
    },
    {
      name: 'disputeResolved'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'dispute'
            type: 'pubkey'
          },
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'ruling'
            type: {
              defined: {
                name: 'ruling'
              }
            }
          },
          {
            name: 'totalVotes'
            type: 'u16'
          },
        ]
      }
    },
    {
      name: 'disputeStatus'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'open'
          },
          {
            name: 'resolved'
          },
        ]
      }
    },
    {
      name: 'platform'
      docs: ['Global platform configuration. Singleton PDA.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            docs: ['Platform admin who can update config']
            type: 'pubkey'
          },
          {
            name: 'feeBps'
            docs: ['Platform fee in basis points (e.g. 250 = 2.5%)']
            type: 'u16'
          },
          {
            name: 'minBountyLamports'
            docs: ['Minimum task bounty in lamports']
            type: 'u64'
          },
          {
            name: 'treasury'
            docs: ['Fee recipient wallet']
            type: 'pubkey'
          },
          {
            name: 'taskCount'
            docs: ['Global sequential task counter']
            type: 'u64'
          },
          {
            name: 'templateCount'
            docs: ['Global sequential template counter']
            type: 'u64'
          },
          {
            name: 'totalSettledLamports'
            docs: ['Cumulative settled volume in lamports']
            type: 'u64'
          },
          {
            name: 'disputeVotingPeriod'
            docs: ['Dispute voting period in seconds']
            type: 'i64'
          },
          {
            name: 'disputeMinVotes'
            docs: ['Minimum votes required to resolve a dispute']
            type: 'u8'
          },
          {
            name: 'minVoterReputation'
            docs: ['Minimum reputation score required to vote on disputes']
            type: 'i64'
          },
          {
            name: 'claimGracePeriod'
            docs: ['Grace period (seconds) after deadline for Claimed tasks before expiry']
            type: 'i64'
          },
          {
            name: 'isPaused'
            docs: ['Whether the platform is paused (emergency stop)']
            type: 'bool'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'platformInitialized'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            type: 'pubkey'
          },
          {
            name: 'feeBps'
            type: 'u16'
          },
          {
            name: 'treasury'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'ruling'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'pending'
          },
          {
            name: 'creatorWins'
          },
          {
            name: 'agentWins'
          },
          {
            name: 'split'
          },
        ]
      }
    },
    {
      name: 'submissionRejected'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'reasonHash'
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'task'
      docs: ['Individual task with escrowed SOL bounty.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'creator'
            docs: ['Task creator (bounty depositor)']
            type: 'pubkey'
          },
          {
            name: 'taskIndex'
            docs: ['Sequential task index (global)']
            type: 'u64'
          },
          {
            name: 'bountyLamports'
            docs: ['Bounty amount in lamports (held in this PDA)']
            type: 'u64'
          },
          {
            name: 'status'
            docs: ['Current task status']
            type: {
              defined: {
                name: 'taskStatus'
              }
            }
          },
          {
            name: 'agent'
            docs: ['Assigned agent (Pubkey::default if unclaimed)']
            type: 'pubkey'
          },
          {
            name: 'deadline'
            docs: ['Unix timestamp deadline']
            type: 'i64'
          },
          {
            name: 'createdAt'
            docs: ['Creation timestamp']
            type: 'i64'
          },
          {
            name: 'settledAt'
            docs: ['Settlement timestamp (0 if unsettled)']
            type: 'i64'
          },
          {
            name: 'reputationReward'
            docs: ['Reputation reward on task approval']
            type: 'i64'
          },
          {
            name: 'title'
            docs: ['Task title (max 64 chars)']
            type: 'string'
          },
          {
            name: 'descriptionHash'
            docs: ['IPFS/Arweave content hash of full description']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'deliverableHash'
            docs: ['Content hash of submitted deliverable']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'templateIndex'
            docs: ['Template index (1-indexed, 0 = no template)']
            type: 'u64'
          },
          {
            name: 'rejectionCount'
            docs: ["Number of times this task's submission has been rejected"]
            type: 'u8'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'taskCancelled'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'creator'
            type: 'pubkey'
          },
          {
            name: 'refundedLamports'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'taskCategory'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'dataLabeling'
          },
          {
            name: 'literatureReview'
          },
          {
            name: 'codeReview'
          },
          {
            name: 'translation'
          },
          {
            name: 'analysis'
          },
          {
            name: 'research'
          },
          {
            name: 'other'
          },
        ]
      }
    },
    {
      name: 'taskClaimed'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'taskIndex'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'taskCreated'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'creator'
            type: 'pubkey'
          },
          {
            name: 'taskIndex'
            type: 'u64'
          },
          {
            name: 'bountyLamports'
            type: 'u64'
          },
          {
            name: 'deadline'
            type: 'i64'
          },
        ]
      }
    },
    {
      name: 'taskExpired'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'creator'
            type: 'pubkey'
          },
          {
            name: 'refundedLamports'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'taskSettled'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'task'
            type: 'pubkey'
          },
          {
            name: 'agent'
            type: 'pubkey'
          },
          {
            name: 'payoutLamports'
            type: 'u64'
          },
          {
            name: 'feeLamports'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'taskStatus'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'open'
          },
          {
            name: 'claimed'
          },
          {
            name: 'submitted'
          },
          {
            name: 'approved'
          },
          {
            name: 'rejected'
          },
          {
            name: 'cancelled'
          },
          {
            name: 'expired'
          },
          {
            name: 'disputed'
          },
        ]
      }
    },
    {
      name: 'taskTemplate'
      docs: ['Reusable task template.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'creator'
            docs: ['Template creator']
            type: 'pubkey'
          },
          {
            name: 'templateIndex'
            docs: ['Sequential template index']
            type: 'u64'
          },
          {
            name: 'title'
            docs: ['Template title']
            type: 'string'
          },
          {
            name: 'descriptionHash'
            docs: ['Description content hash']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'defaultBountyLamports'
            docs: ['Default bounty amount']
            type: 'u64'
          },
          {
            name: 'timesUsed'
            docs: ['Number of tasks created from this template']
            type: 'u64'
          },
          {
            name: 'category'
            docs: ['Task category']
            type: {
              defined: {
                name: 'taskCategory'
              }
            }
          },
          {
            name: 'isActive'
            docs: ['Whether template is active']
            type: 'bool'
          },
          {
            name: 'bump'
            docs: ['PDA bump']
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'templateCreated'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'template'
            type: 'pubkey'
          },
          {
            name: 'creator'
            type: 'pubkey'
          },
          {
            name: 'templateIndex'
            type: 'u64'
          },
          {
            name: 'category'
            type: {
              defined: {
                name: 'taskCategory'
              }
            }
          },
        ]
      }
    },
    {
      name: 'voteCast'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'dispute'
            type: 'pubkey'
          },
          {
            name: 'voter'
            type: 'pubkey'
          },
          {
            name: 'ruling'
            type: {
              defined: {
                name: 'ruling'
              }
            }
          },
        ]
      }
    },
  ]
}
