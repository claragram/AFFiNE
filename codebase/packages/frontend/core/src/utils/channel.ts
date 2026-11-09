import { z } from 'zod';

export const appSchemes = z.enum([
  'claranote',
  'claranote-canary',
  'claranote-beta',
  'claranote-internal',
  'claranote-dev',
  'affine',
  'affine-canary',
  'affine-beta',
  'affine-internal',
  'affine-dev',
]);

export type Scheme = z.infer<typeof appSchemes>;
export type Channel = 'stable' | 'canary' | 'beta' | 'internal';

export const schemeToChannel = {
  claranote: 'stable',
  'claranote-canary': 'canary',
  'claranote-beta': 'beta',
  'claranote-internal': 'internal',
  'claranote-dev': 'canary',
  affine: 'stable',
  'affine-canary': 'canary',
  'affine-beta': 'beta',
  'affine-internal': 'internal',
  'affine-dev': 'canary', // dev does not have a dedicated app. use canary as the placeholder.
} as Record<Scheme, Channel>;

export const channelToScheme = {
  stable: 'claranote',
  canary: BUILD_CONFIG.debug ? 'claranote-dev' : 'claranote-canary',
  beta: 'claranote-beta',
  internal: 'claranote-internal',
} as Record<Channel, Scheme>;

export const appIconMap = {
  stable: '/imgs/app-icon-stable.ico',
  canary: '/imgs/app-icon-canary.ico',
  beta: '/imgs/app-icon-beta.ico',
  internal: '/imgs/app-icon-internal.ico',
} satisfies Record<Channel, string>;

export const appNames = {
  stable: 'Claranote',
  canary: 'Claranote Canary',
  beta: 'Claranote Beta',
  internal: 'Claranote Internal',
} satisfies Record<Channel, string>;

export const appSchemaUrl = z.custom<string>(
  (url: string) => {
    try {
      return appSchemes.safeParse(new URL(url).protocol.replace(':', ''))
        .success;
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL or protocol' }
);
