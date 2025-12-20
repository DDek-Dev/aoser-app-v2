// apiClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tokens } from 'types/auth';
import { UserProfile } from 'types/profile';

export const storeTokens = async (tokens: Tokens ): Promise<void> => {
  try {
    await AsyncStorage.setItem('authTokens', JSON.stringify(tokens));
 
  } catch (error) {
    console.log('Failed to store tokens', error);
    throw error;
  }
};
export const getStoredTokens = async (): Promise<Tokens | null> => {
  try {
    const tokens = await AsyncStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.log('Failed to get stored tokens', error);
    return null;
  }
};



export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authTokens');
  } catch (error) {
    console.log('Failed to clear tokens', error);
    throw error;
  }
};


// user 
export const storeUser = async (user: UserProfile): Promise<void> => {
  console.log("STORE USER", JSON.stringify(user, null, 2));
  try {
    await AsyncStorage.setItem('authUser', JSON.stringify(user));
  } catch (error) {
    console.log('Failed to store user', error);
    throw error;
  }
};

export const getStoredUser = async (): Promise<UserProfile | null> => {
  try {
    const user = await AsyncStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log('Failed to get stored user', error);
    return null;
  }
};



export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authUser');
  } catch (error) {
    console.log('Failed to clear user', error);
    throw error;
  }
};