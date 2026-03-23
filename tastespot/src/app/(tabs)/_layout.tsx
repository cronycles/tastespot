import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

type TabConfig = {
  name: string
  title: string
  icon: IoniconName
  iconFocused: IoniconName
}

const tabs: TabConfig[] = [
  { name: 'index', title: 'Home', icon: 'map-outline', iconFocused: 'map' },
  { name: 'favorites', title: 'Preferiti', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'nearby', title: 'Vicino a me', icon: 'list-outline', iconFocused: 'list' },
  { name: 'profile', title: 'Area Privata', icon: 'person-outline', iconFocused: 'person' },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
        },
      }}
    >
      {tabs.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? iconFocused : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
