export const apiRoutes = {
  dietarySuggestions: '/api/dietary-suggestions',
  grocerySuggestions: '/api/grocery-suggestions',
  shoppingSuggestions: '/api/shopping-suggestions',
} as const;

export type ApiRoute = (typeof apiRoutes)[keyof typeof apiRoutes]; 