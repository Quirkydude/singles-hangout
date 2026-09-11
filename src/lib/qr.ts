import "server-only";
import QRCode from "qrcode";
import { getTicketUrl } from "@/lib/event";

/**
 * Renders the QR code for a registration as an inline SVG string.
 * The QR payload is the public ticket URL, so a standard phone camera
 * can open the ticket directly.
 */
export async function renderTicketQr(code: string): Promise<string> {
  return QRCode.toString(getTicketUrl(code), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0b0b0d", light: "#ffffff" },
  });
}
