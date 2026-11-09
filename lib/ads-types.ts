export type AdZone =
  | "after-header"
  | "before-footer"
  | "side-left"
  | "side-right"
  | "home-after-hero"
  | "pdf-after-tool";

export type AdRouteScope = "all" | "home" | "pdf" | "exact";
export type AdDevice = "all" | "desktop" | "mobile";

export interface AdUnitRow {
  id: string;
  name: string;
  publisher_id: string;
  slot_id: string;
  ad_format: string | null;
  ad_layout: string | null;
  ad_layout_key: string | null;
  width_px: number | null;
  height_px: number | null;
  full_width_responsive: boolean;
  zone: AdZone;
  route_scope: AdRouteScope;
  route_path: string | null;
  device: AdDevice;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by_email: string | null;
}

export type PublicAdUnit = Pick<
  AdUnitRow,
  | "id"
  | "name"
  | "publisher_id"
  | "slot_id"
  | "ad_format"
  | "ad_layout"
  | "ad_layout_key"
  | "width_px"
  | "height_px"
  | "full_width_responsive"
  | "zone"
  | "device"
  | "priority"
>;

export const AD_ZONES: { value: AdZone; label: string; description: string }[] = [
  { value: "after-header", label: "After header — every selected page", description: "A responsive unit below the global navbar." },
  { value: "before-footer", label: "Before footer — every selected page", description: "A responsive unit above the global footer." },
  { value: "side-left", label: "Left desktop rail", description: "A fixed rail on wide desktop screens only." },
  { value: "side-right", label: "Right desktop rail", description: "A fixed rail on wide desktop screens only." },
  { value: "home-after-hero", label: "Homepage after hero", description: "Requires one AdZone component below the homepage hero." },
  { value: "pdf-after-tool", label: "PDF page after tool", description: "Requires one AdZone component near the end of each PDF tool page." },
];

export const ROUTE_SCOPES: { value: AdRouteScope; label: string }[] = [
  { value: "all", label: "All eligible public pages" },
  { value: "home", label: "Homepage only" },
  { value: "pdf", label: "All PDF tool pages" },
  { value: "exact", label: "One exact route" },
];

export const DEVICE_OPTIONS: { value: AdDevice; label: string }[] = [
  { value: "all", label: "All devices" },
  { value: "desktop", label: "Desktop only" },
  { value: "mobile", label: "Mobile only" },
];
