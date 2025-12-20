// import React from 'react';
// import { Text, View, StyleSheet } from 'react-native';

// // Conditional import with fallback
// let Icons: any = {};
// let hasLucideIcons = true;

// try {
//   Icons = require('lucide-react-native');
// } catch (error) {
//   console.warn('lucide-react-native not available, using fallback');
//   hasLucideIcons = false;
// }

// // Your service types data from database
// const serviceTypes = [
//   { _id: "1", name: "Tech", icon: "Monitor", color: "#3b82f6" },
//   { _id: "2", name: "Art", icon: "Palette", color: "#8b5cf6" },
//   { _id: "3", name: "Writing", icon: "PenTool", color: "#f97316" },
//   { _id: "4", name: "Tourism", icon: "Map", color: "#10b981" },
//   { _id: "5", name: "Cooking", icon: "ChefHat", color: "#eab308" }
// ];

// // Fallback icon component
// const FallbackIcon = ({ color }: { color: string }) => (
//   <View style={[styles.fallbackIcon, { backgroundColor: color }]}>
//     <Text style={styles.fallbackText}>?</Text>
//   </View>
// );

// // Define the type for our icon component
// type IconComponentType = React.ComponentType<{
//   size?: number;
//   color?: string;
//   style?: any;
// }>;

// export const ServiceTypeList = () => {
//   const getIconComponent = (iconName: string): IconComponentType | null => {
//     if (!hasLucideIcons || !iconName) return null;
    
//     const iconKey = iconName as keyof typeof Icons;
//     const icon = Icons[iconKey];
    
//     // Check if the icon exists and is a valid component
//     if (icon && typeof icon === 'function') {
//       return icon as IconComponentType;
//     }
    
//     // Try fallback icons
//     const fallbackIcon = Icons.Monitor || Icons.Circle;
//     if (fallbackIcon && typeof fallbackIcon === 'function') {
//       return fallbackIcon as IconComponentType;
//     }
    
//     return null;
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Service Types</Text>
//       {serviceTypes.map(service => {
//         const IconComponent = getIconComponent(service.icon);
        
//         return (
//           <View key={service._id} style={styles.serviceItem}>
//             {IconComponent ? (
//               <IconComponent color={service.color} size={24} />
//             ) : (
//               <FallbackIcon color={service.color} />
//             )}
//             <Text style={styles.serviceText}>{service.name}</Text>
//             <Text style={styles.iconName}>({service.icon})</Text>
//           </View>
//         );
//       })}
//       {!hasLucideIcons && (
//         <Text style={styles.warning}>
//           Note: Install 'react-native-svg' and 'lucide-react-native' for proper icons
//         </Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#333',
//   },
//   serviceItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 8,
//     padding: 12,
//     backgroundColor: 'white',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   serviceText: {
//     marginLeft: 12,
//     fontSize: 16,
//     fontWeight: '500',
//     flex: 1,
//   },
//   iconName: {
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   fallbackIcon: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   fallbackText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   warning: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: '#fef3cd',
//     borderRadius: 8,
//     color: '#856404',
//     fontSize: 12,
//   },
// });