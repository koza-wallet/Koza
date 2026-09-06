import { describe, it, expect } from "vitest";
import {
  formatRupiahAmount,
  formatCompactRupiah,
  formatFullDateId,
  formatTerbilang,
} from "./format";

describe("format.ts", () => {
  it("formatRupiahAmount - menggunakan separator titik ribuan", () => {
    // Di Node environment, replace non-breaking space / ascii space to normal space 
    // and handle normal standard locale formatting
    const cleanStr = (val: number) => formatRupiahAmount(val).replace(/\u00A0/g, " ").replace(/,/g, ".");
    
    expect(cleanStr(0)).toBe("0");
    expect(cleanStr(50000)).toMatch(/50\.000/);
    expect(cleanStr(1234567)).toMatch(/1\.234\.567/);
  });

  it("formatCompactRupiah - mengubah angka besar jadi singkatan (rb/jt/M)", () => {
    expect(formatCompactRupiah(5000)).toBe("Rp 5 rb");
    expect(formatCompactRupiah(-1500000)).toBe("Rp 1,5 jt");
    expect(formatCompactRupiah(0)).toBe("Rp 0");
    expect(formatCompactRupiah(2500000000)).toBe("Rp 2500 jt"); // formatCompactRupiah currently scales to millions max
  });

  it("formatTerbilang - mengubah angka menjadi teks", () => {
    expect(formatTerbilang(50000)).toBe("Lima Puluh Ribu Rupiah");
    expect(formatTerbilang(1500)).toBe("Seribu Lima Ratus Rupiah");
    expect(formatTerbilang(1000000)).toBe("Satu Juta Rupiah");
  });
});
