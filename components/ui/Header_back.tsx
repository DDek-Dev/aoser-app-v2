import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

// Define the icon libraries type
type IconLibrary = 'MaterialIcons' | 'Ionicons'

// Define the props interface
interface HeaderBackProps {
  text?: string
  iconName?: string
  iconLibrary?: IconLibrary
  iconSize?: number
  iconColor?: string
  textStyle?: string
  containerStyle?: string
  backgroundColor?: string
  onPress?: () => void
}

function Header_back({
  text ,
  iconName = 'chevron-left',
  iconLibrary = 'MaterialIcons',
  iconSize = 32,
  iconColor = '#333',
  textStyle = 'text-subheading  text-text',
  containerStyle = 'flex-row items-center gap-2',
  backgroundColor,
  onPress
}: HeaderBackProps) {
  
  // Function to render the appropriate icon
  const renderIcon = () => {
    const iconProps = {
      name: iconName as any,
      size: iconSize,
      color: iconColor
    }
    
    if (iconLibrary === 'Ionicons') {
      return <Ionicons {...iconProps} />
    } else {
      return <MaterialIcons {...iconProps} />
    }
  }

  // Create container style with optional background
  const containerStyles = [
    containerStyle,
    backgroundColor ? `${backgroundColor}` : 'white'
  ].filter(Boolean).join(' ')

  return (
    <View 
      className={`${containerStyles}`}
      onTouchEnd={onPress}
    
    >
      {iconName && renderIcon()}
      {text && <Text className={textStyle}>{text}</Text>}
    </View>
  )
}

export default Header_back