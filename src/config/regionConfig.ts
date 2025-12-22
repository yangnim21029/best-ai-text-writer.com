import { TargetAudience } from '../types';

export interface RegionConfig {
  name: string;
  currency: string;
  excludeRegions: string[];
  examples: string[];
}

export const REGION_CONFIG: Record<TargetAudience, RegionConfig> = {
  'zh-TW': {
    name: '台灣',
    currency: 'NT$/新台幣',
    excludeRegions: ['HK', 'CN', 'MY'],
    examples: ['蝦皮', 'momo購物', '台北捷運', '健保', '高鐵', '全聯', '7-11'],
  },
  'zh-HK': {
    name: '香港',
    currency: 'HKD/$港幣',
    excludeRegions: ['TW', 'CN', 'MY'],
    examples: ['HKTVmall', '港鐵', 'OK便利店', '八達通', '強積金'],
  },
  'zh-MY': {
    name: '馬來西亞',
    currency: 'RM/馬幣',
    excludeRegions: ['TW', 'HK', 'CN'],
    examples: ['Lazada', 'Shopee', 'Grab', "Touch 'n Go", 'EPF'],
  },
};

export const getRegionLabel = (audience: TargetAudience): string => {
  return REGION_CONFIG[audience]?.name || audience;
};
