/**
 * Utility to convert numbers into Indian currency words (Lakhs, Crores, Thousands)
 */
export function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'INR Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertTwoDigits = (n: number): string => {
    if (n < 20) return singleDigits[n];
    const tensDigit = Math.floor(n / 10);
    const remainder = n % 10;
    return `${tens[tensDigit]}${remainder ? ' ' + singleDigits[remainder] : ''}`.trim();
  };

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundred ? `${singleDigits[hundred]} Hundred` : '';
    const restPart = rest ? convertTwoDigits(rest) : '';
    return [hundredPart, restPart].filter(Boolean).join(' ');
  };

  const integerPart = Math.floor(num);
  
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundredAndBelow = integerPart % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (hundredAndBelow > 0) {
    parts.push(convertThreeDigits(hundredAndBelow));
  }

  const result = parts.join(' ').trim();
  return result ? `INR ${result} Only` : 'INR Zero Only';
}
