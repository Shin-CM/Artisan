import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { calendarHolidayHandlers } from "@/lib/apiMock/handlers/calendarHolidays";
import { calendarEventHandlers } from "@/lib/apiMock/handlers/calendarEvents";
import { catalogHandlers } from "@/lib/apiMock/handlers/catalog";
import { discountPresetHandlers } from "@/lib/apiMock/handlers/discountPresets";
import { clientFollowupHandlers } from "@/lib/apiMock/handlers/clientFollowup";
import { crmOpportunityHandlers } from "@/lib/apiMock/handlers/crmOpportunities";
import { clientHandlers } from "@/lib/apiMock/handlers/clients";
import { extraHandlers } from "@/lib/apiMock/handlers/extras";
import { invoiceHandlers } from "@/lib/apiMock/handlers/invoices";
import { manualRevenueHandlers } from "@/lib/apiMock/handlers/manualRevenue";
import { quoteHandlers } from "@/lib/apiMock/handlers/quotes";
import { projectHandlers } from "@/lib/apiMock/handlers/projects";
import { purchaseOrderHandlers } from "@/lib/apiMock/handlers/purchaseOrders";
import { recoveryActionHandlers } from "@/lib/apiMock/handlers/recoveryActions";
import { workspaceHandlers } from "@/lib/apiMock/handlers/workspaces";
import { stockHandlers } from "@/lib/apiMock/handlers/stock";
import { localApiHandlers } from "@/lib/apiMock/handlers/localApi";

export const mockHandlers: Record<string, MockHandler> = {
  ...localApiHandlers,
  ...stockHandlers,
  ...workspaceHandlers,
  ...projectHandlers,
  ...clientHandlers,
  ...crmOpportunityHandlers,
  ...clientFollowupHandlers,
  ...calendarEventHandlers,
  ...calendarHolidayHandlers,
  ...catalogHandlers,
  ...discountPresetHandlers,
  ...quoteHandlers,
  ...purchaseOrderHandlers,
  ...recoveryActionHandlers,
  ...invoiceHandlers,
  ...manualRevenueHandlers,
  ...extraHandlers,
};
