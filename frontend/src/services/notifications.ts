import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

const REMINDER_SETTINGS_KEY = 'reminder_settings_v1';
const REMINDER_NOTIFICATION_ID = 1001;
const TEST_NOTIFICATION_ID = 1002;
const REMINDER_CHANNEL_ID = 'mankeu-reminders';

export interface ReminderSettings {
    enabled: boolean;
    time: string;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
    enabled: false,
    time: '20:00',
};

const parseTime = (value: string) => {
    const [hourRaw, minuteRaw] = value.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { hour: 20, minute: 0 };
    }

    return {
        hour: Math.max(0, Math.min(23, hour)),
        minute: Math.max(0, Math.min(59, minute)),
    };
};

const isNativePlatform = () => Capacitor.isNativePlatform();

export const loadReminderSettings = async (): Promise<ReminderSettings> => {
    const { value } = await Preferences.get({ key: REMINDER_SETTINGS_KEY });
    if (!value) return DEFAULT_REMINDER_SETTINGS;

    try {
        const parsed = JSON.parse(value) as Partial<ReminderSettings>;
        return {
            enabled: parsed.enabled ?? DEFAULT_REMINDER_SETTINGS.enabled,
            time: parsed.time ?? DEFAULT_REMINDER_SETTINGS.time,
        };
    } catch {
        return DEFAULT_REMINDER_SETTINGS;
    }
};

const saveReminderSettings = async (settings: ReminderSettings) => {
    await Preferences.set({
        key: REMINDER_SETTINGS_KEY,
        value: JSON.stringify(settings),
    });
};

const cancelReminderNotification = async () => {
    await LocalNotifications.cancel({
        notifications: [{ id: REMINDER_NOTIFICATION_ID }],
    });
};

const ensureNotificationPermission = async () => {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;

    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
};

const scheduleDailyReminder = async (title: string, body: string, time: string) => {
    const { hour, minute } = parseTime(time);

    await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL_ID,
        name: 'Mankeu Reminders',
        importance: 4,
        visibility: 1,
    });

    await cancelReminderNotification();

    await LocalNotifications.schedule({
        notifications: [
            {
                id: REMINDER_NOTIFICATION_ID,
                title,
                body,
                channelId: REMINDER_CHANNEL_ID,
                schedule: {
                    on: { hour, minute },
                    repeats: true,
                    allowWhileIdle: true,
                },
            },
        ],
    });
};

export const applyReminderSettings = async (
    settings: ReminderSettings,
    title: string,
    body: string
) => {
    await saveReminderSettings(settings);

    if (!isNativePlatform()) {
        return { isNative: false, granted: false };
    }

    if (!settings.enabled) {
        await cancelReminderNotification();
        return { isNative: true, granted: true };
    }

    const granted = await ensureNotificationPermission();
    if (!granted) {
        return { isNative: true, granted: false };
    }

    await scheduleDailyReminder(title, body, settings.time);
    return { isNative: true, granted: true };
};

export const sendTestNotification = async (title: string, body: string) => {
    if (!isNativePlatform()) {
        return { isNative: false, granted: false };
    }

    const granted = await ensureNotificationPermission();
    if (!granted) {
        return { isNative: true, granted: false };
    }

    await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL_ID,
        name: 'Mankeu Reminders',
        importance: 4,
        visibility: 1,
    });

    await LocalNotifications.cancel({ notifications: [{ id: TEST_NOTIFICATION_ID }] });

    await LocalNotifications.schedule({
        notifications: [
            {
                id: TEST_NOTIFICATION_ID,
                title,
                body,
                channelId: REMINDER_CHANNEL_ID,
                schedule: {
                    at: new Date(Date.now() + 3000),
                    allowWhileIdle: true,
                },
            },
        ],
    });

    return { isNative: true, granted: true };
};
