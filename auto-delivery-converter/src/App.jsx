import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

export default function AutoDeliveryConverter() {
  const [fileName, setFileName] = useState("");
  const [converted, setConverted] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const result = processData(jsonData);

      const newWs = XLSX.utils.aoa_to_sheet(result);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, "배송목록");

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(newWb, `${today}(배송목록).xlsx`);
      setConverted(true);
    };
    reader.readAsBinaryString(file);
  };

  const processData = (rows) => {
    const headerRow = rows[2];
    const dataRows = rows.slice(3);

    const header = [
      "받는분성명",
      "받는분전화번호",
      "받는분주소(전체, 분할)",
      "품목명",
      "배송메세지1",
      "박스수량"
    ];

    const getColIndex = (label) => headerRow.findIndex((col) => col === label);

    const 수취인 = getColIndex("수취인");
    const 휴대폰 = getColIndex("수쥐인 휴대폰번호");
    const 주소 = getColIndex("배송지 정보");
    const 요청 = getColIndex("요청사항");
    const 차량 = getColIndex("차량명");
    const 부품 = getColIndex("부품명");

    const formatted = [header];

    for (const row of dataRows) {
      const 품목 = `${row[차량] || ""} ${row[부품] || ""}`.trim();
      const 요청메시지 = row[요청]
        ? `(${row[요청]}) 파손주의품목 취급주의!!!`
        : "파손주의품목 취급주의!!!";

      formatted.push([
        row[수취인] || "",
        row[휴대폰] || "",
        row[주소] || "",
        품목,
        요청메시지,
        1
      ]);
    }

    return formatted;
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        배송목록 자동 변환기 (무설치 웹버전)
      </h1>

      <Card className="shadow-xl">
        <CardContent className="p-6 flex flex-col gap-4">
          <label className="text-sm font-medium">엑셀 파일 업로드 (.xlsx)</label>
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />

          {fileName && (
            <p className="text-sm text-gray-500">업로드한 파일: {fileName}</p>
          )}

          <Button disabled={!fileName} className="mt-4">
            <Upload className="mr-2 h-4 w-4" /> 변환 시작
          </Button>

          {converted && (
            <motion.div
              className="mt-6 text-green-600 font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              변환이 완료되었습니다! 🎉<br />
              자동 다운로드가 시작되었어요.
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
