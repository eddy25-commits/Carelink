import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { notificationsRepository } from "./notifications.repository";
import { renderTemplate, TemplateName } from "./notification-templates";
import { NotificationChannel, Report } from "../../types/domain";

interface DispatchResult {
  success: boolean;
  failureReason?: string;
}

// Provider abstraction: swap the implementation of `send` to plug in a
// real SMS gateway (e.g. Twilio, Africa's Talking) or push service
// without touching any calling code. Defaults to structured logging so
// the system is fully runnable/demoable without external credentials.
interface NotificationProvider {
  send(channel: NotificationChannel, recipient: string, message: string): Promise<DispatchResult>;
}

class LogNotificationProvider implements NotificationProvider {
  async send(channel: NotificationChannel, recipient: string, message: string): Promise<DispatchResult> {
    logger.info({ channel, recipient, message }, "[notification:log-provider] dispatched");
    return { success: true };
  }
}

// Placeholder providers — implement with a real gateway when moving
// beyond the current project's prototype scope (see proposal, Section 6).
class SmsNotificationProvider implements NotificationProvider {
  async send(channel: NotificationChannel, recipient: string, message: string): Promise<DispatchResult> {
    logger.warn({ channel, recipient, message }, "SMS provider not configured; falling back to log");
    return { success: true };
  }
}

class PushNotificationProvider implements NotificationProvider {
  async send(channel: NotificationChannel, recipient: string, message: string): Promise<DispatchResult> {
    logger.warn({ channel, recipient, message }, "Push provider not configured; falling back to log");
    return { success: true };
  }
}

function getProvider(): NotificationProvider {
  switch (env.NOTIFICATION_PROVIDER) {
    case "sms":
      return new SmsNotificationProvider();
    case "push":
      return new PushNotificationProvider();
    default:
      return new LogNotificationProvider();
  }
}

const provider = getProvider();

export const notificationsService = {
  /**
   * Renders the given template in the reporter's language, persists a
   * notification record, and dispatches it through the active provider.
   * Never throws on dispatch failure — a notification issue should
   * never block the underlying triage workflow from completing.
   */
  async notifyReporter(report: Report, template: TemplateName): Promise<void> {
    if (report.is_anonymous || !report.reporter_contact) {
      return; // Nothing to notify — anonymity is honored (see proposal Section 5, abuse/anonymity safeguards).
    }

    const message = renderTemplate(template, report.reporter_language, { reportToken: report.report_token });
    const channel: NotificationChannel = "sms";

    const notification = await notificationsRepository.create({
      report_id: report.id,
      channel,
      recipient: report.reporter_contact,
      template,
      message,
      language: report.reporter_language,
      status: "pending",
    });

    try {
      const result = await provider.send(channel, report.reporter_contact, message);
      if (result.success) {
        await notificationsRepository.markSent(notification.id);
      } else {
        await notificationsRepository.markFailed(notification.id, result.failureReason ?? "Unknown error");
      }
    } catch (err) {
      logger.error({ err, notificationId: notification.id }, "Notification dispatch failed");
      await notificationsRepository.markFailed(notification.id, (err as Error).message);
    }
  },
};
