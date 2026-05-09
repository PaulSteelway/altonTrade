import {useQuery} from '@tanstack/react-query';
import axios from 'axios';

/** Alton collection on TON — same as [frontend/src/queries/getNfts.ts](frontend/src/queries/getNfts.ts). */
const ALTON_COLLECTION_ADDRESS =
  'EQB0-OICCUfZiC_Jut84fULxNICbl2JdVL7ew2iPJc8b8yyG';

export type AltonNftItem = {
  content?: {
    image?: string;
    name?: string;
  };
};

export type AltonNftsResponse = {
  nft_items?: AltonNftItem[];
};

async function fetchAltonNfts(ownerAddress: string): Promise<AltonNftsResponse> {
  const {data} = await axios.get<AltonNftsResponse>(
    'https://toncenter.com/api/v3/nft/items',
    {
      params: {
        owner_address: ownerAddress,
        collection_address: ALTON_COLLECTION_ADDRESS,
      },
    },
  );
  return data ?? {nft_items: []};
}

/**
 * NFT ваучеров Alton для владельца (user-friendly TON-адрес), как в веб `useNFTs`.
 */
export function useAltonNfts(ownerAddress: string | null) {
  return useQuery({
    queryKey: ['alton-nfts', ownerAddress],
    queryFn: () => fetchAltonNfts(ownerAddress!),
    enabled: !!ownerAddress?.trim(),
    staleTime: 1000 * 60 * 60,
  });
}

export function sumVoucherAmountFromNfts(items: AltonNftItem[]): number {
  return items.reduce((sum, item) => {
    const name = item.content?.name ?? '';
    const match = name.match(/^(\d+(?:,\d+)*) \$ALTON Voucher/);
    if (match) {
      const voucherValue = parseInt(match[1].replace(/,/g, ''), 10);
      return sum + (Number.isFinite(voucherValue) ? voucherValue : 0);
    }
    return sum;
  }, 0);
}
