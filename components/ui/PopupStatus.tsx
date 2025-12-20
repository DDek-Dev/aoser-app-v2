import { ALERT_TYPE, Dialog } from 'react-native-alert-notification';

export interface PopupStatusProps {
  type: 'success' | 'fail';
  title?: string;
  message: string;
  buttonText?: string;
  vibrate?: boolean;
  onPress?: () => void;
}

class PopupStatus {
  static show({
    type,
    title,
    message,
    buttonText = 'Close',
    vibrate = true,
    onPress,
  }: PopupStatusProps) {
    const config = {
      success: {
        type: ALERT_TYPE.SUCCESS,
        defaultTitle: 'Success',
      },
      fail: {
        type: ALERT_TYPE.DANGER,
        defaultTitle: 'Failed',
      },
    };

    Dialog.show({
      type: config[type].type,
      title: title || config[type].defaultTitle,
      textBody: message,
      button: buttonText,
    //   vibrate,
    //   onPress,
    });
  }

  // Convenience methods for easier usage
  static success(message: string, options?: Partial<Omit<PopupStatusProps, 'type' | 'message'>>) {
    PopupStatus.show({
      type: 'success',
      message,
      ...options,
    });
  }

  static fail(message: string, options?: Partial<Omit<PopupStatusProps, 'type' | 'message'>>) {
    PopupStatus.show({
      type: 'fail',
      message,
      ...options,
    });
  }
}

export default PopupStatus;