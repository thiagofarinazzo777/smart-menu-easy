/**
 * Generates a PIX EMV "Copia e Cola" payload following the Brazilian Central Bank specification.
 * Reference: https://www.bcb.gov.br/content/estabilidadefinanceira/forumpirR1/EMV-QRCPS-MPM-Specification-Version1.1.pdf
 */

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(payload);
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
}

export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId,
}: PixPayloadParams): string {
  // Normalize strings: remove accents, limit length
  const normalize = (s: string, max: number) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .substring(0, max)
      .toUpperCase();

  const gui = tlv("00", "BR.GOV.BCB.PIX");
  const key = tlv("01", pixKey);
  const merchantAccountInfo = tlv("26", gui + key);

  const payloadFormatIndicator = tlv("00", "01");
  const pointOfInitiation = tlv("01", "12"); // dynamic QR
  const merchantCategoryCode = tlv("52", "0000");
  const transactionCurrency = tlv("53", "986"); // BRL
  const transactionAmount = tlv("54", amount.toFixed(2));
  const countryCode = tlv("58", "BR");
  const merchantNameField = tlv("59", normalize(merchantName, 25));
  const merchantCityField = tlv("60", normalize(merchantCity, 15));

  const txIdValue = txId
    ? txId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25)
    : "***";
  const additionalData = tlv("62", tlv("05", txIdValue));

  const payloadWithoutCrc =
    payloadFormatIndicator +
    pointOfInitiation +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantNameField +
    merchantCityField +
    additionalData +
    "6304"; // CRC placeholder

  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}
