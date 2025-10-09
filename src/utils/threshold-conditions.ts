/**
 * Committee Conditions for Threshold Evaluation
 * This defines the mapping between Paper Types, Sourcing Types, and Committee Controls
 */

export interface CommitteeCondition {
  paperTypes: string[];
  sourcingTypes: string[];
  committee: string;
}

/**
 * Common conditions for threshold evaluation across all templates
 * These conditions define which committee should be checked based on:
 * - Paper Type (e.g., 'Approach to Market', 'Contract Award', 'Variation', 'Approval of Sale / Disposal Form')
 * - Sourcing Type (e.g., 'Single Source', 'Sole Source', 'Competitive Bid', 'Any', '')
 * - Committee Control Name (e.g., 'coVenturers_CMC', 'steeringCommittee_SC', etc.)
 */
export const COMMITTEE_CONDITIONS: CommitteeCondition[] = [
  // ACG:CMC conditions
  { paperTypes: ['Contract Award', 'Variation'], sourcingTypes: ['Single Source', 'Sole Source'], committee: 'coVenturers_CMC' },
  { paperTypes: ['Approach to Market', 'Contract Award', 'Variation'], sourcingTypes: ['Competitive Bid'], committee: 'coVenturers_CMC' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'coVenturers_CMC' },

  // ACG:SC conditions
  { paperTypes: ['Approach to Market', 'Contract Award', 'Variation', 'Approval of Sale / Disposal Form'], sourcingTypes: ['Any'], committee: 'steeringCommittee_SC' },

  // SDCC conditions
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Any'], committee: 'contractCommittee_SDCC' },
  { paperTypes: ['Variation'], sourcingTypes: ['Any'], committee: 'contractCommittee_SDCC' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'contractCommittee_SDCC' },

  // SDMC conditions
  { paperTypes: ['Approach to Market', 'Contract Award', 'Variation'], sourcingTypes: ['Any'], committee: 'coVenturers_SDMC' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'coVenturers_SDMC' },

  // SCP CC conditions
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Single Source', 'Sole Source'], committee: 'contractCommittee_SCP_Co_CC' },
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Competitive Bid'], committee: 'contractCommittee_SCP_Co_CC' },
  { paperTypes: ['Variation'], sourcingTypes: ['Any'], committee: 'contractCommittee_SCP_Co_CC' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'contractCommittee_SCP_Co_CC' },

  // SCP Board conditions
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Single Source', 'Sole Source'], committee: 'coVenturers_SCP' },
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Competitive Bid'], committee: 'coVenturers_SCP' },
  { paperTypes: ['Variation'], sourcingTypes: ['Any'], committee: 'coVenturers_SCP' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'coVenturers_SCP' },

  // BTC CC conditions
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Single Source', 'Sole Source'], committee: 'contractCommittee_BTC_CC' },
  { paperTypes: ['Variation'], sourcingTypes: ['Single Source', 'Sole Source'], committee: 'contractCommittee_BTC_CC' },
  { paperTypes: ['Approach to Market', 'Contract Award'], sourcingTypes: ['Competitive Bid'], committee: 'contractCommittee_BTC_CC' },
  { paperTypes: ['Variation'], sourcingTypes: ['Competitive Bid'], committee: 'contractCommittee_BTC_CC' },
  { paperTypes: ['Approval of Sale / Disposal Form'], sourcingTypes: ['Any', ''], committee: 'contractCommittee_BTC_CC' }
];

