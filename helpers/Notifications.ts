import { notifications as mantineNotifications } from '@mantine/notifications';

export type NotificationParams = {
  title: string;
  message: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'orange';
};

export class Notifications {
  static show(params: NotificationParams): void {
    mantineNotifications.show({
      title: params.title,
      message: params.message,
      color: params.color,
      position: 'top-center',
    });
  }

  static showSuccess(params: NotificationParams): void {
    this.show({
      ...params,
      color: 'green',
    });
  }

  static showError(params: NotificationParams): void {
    this.show({
      ...params,
      color: 'red',
    });
  }
}
