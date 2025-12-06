export const TEAM_MEMBERS = [
  { firstName: 'Aneta', lastName: 'Kmetíková' },
  { firstName: 'Matěj', lastName: 'Hrnčíř' },
  { firstName: 'Marko', lastName: 'Petrović' },
  { firstName: 'Matyas', lastName: 'Hodek' },
  { firstName: 'Julie', lastName: 'Holá' },
  { firstName: 'Veronika', lastName: 'Honsová' },
  { firstName: 'Jan', lastName: 'Chmelík' },
  { firstName: 'David', lastName: 'Izák' },
  { firstName: 'Ondřej', lastName: 'Kulhavý' },
  { firstName: 'Marie', lastName: 'Machytková' },
  { firstName: 'Anna', lastName: 'Pokorná' },
  { firstName: 'Dominika', lastName: 'Poláková' },
  { firstName: 'Annabela', lastName: 'Šimková' },
  { firstName: 'David', lastName: 'Štantejský' },
  { firstName: 'Laura', lastName: 'Šimůnková' },
  { firstName: 'Matěj', lastName: 'Vrbas' },
] as const

export const getFullName = (member: typeof TEAM_MEMBERS[number]) => 
  `${member.firstName} ${member.lastName}`

export const getAllFullNames = () => 
  TEAM_MEMBERS.map(getFullName)
