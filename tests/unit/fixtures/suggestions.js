export const rawSuggestionFixtures = [
  {
    place_id: 'place',
    description: 'description',
    matched_substrings: ['matched'],
  },
]

export const normalizedSuggestionFixtures = rawSuggestionFixtures.map(s => ({
  placeId: s.place_id,
  description: s.description,
  matchedSubstrings: s.matched_substrings[0],
}))
