import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "@/stores/notification-store";

describe("NotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ unreadCount: 0 });
  });

  it("초기 상태는 unreadCount 0이다", () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
  });

  it("setUnreadCount로 개수를 설정한다", () => {
    useNotificationStore.getState().setUnreadCount(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it("decrementUnread로 1 감소한다", () => {
    useNotificationStore.getState().setUnreadCount(3);
    useNotificationStore.getState().decrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("decrementUnread는 0 이하로 내려가지 않는다", () => {
    useNotificationStore.getState().setUnreadCount(0);
    useNotificationStore.getState().decrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
