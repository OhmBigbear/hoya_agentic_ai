# Maintenance CSV Data Profile

Generated from `uploads`.

All files are UTF-8 exports with comma-delimited CSV structure. The equipment export includes a report preamble; import code locates the expected equipment header before reading data rows.

### EquipmentListReport on 26 Feb'2026.csv

- Dataset key: `equipment`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 4
- Columns: 13
- Data rows: 1960
- Candidate primary keys: none detected; use surrogate key
- Candidate foreign keys: `EquipmentNo -> maintenance.equipment.equipment_no`
- Date-like columns: `RegisterDueDate`, `DisposalDate`
- Numeric-like columns: `Location`
- Nullable columns: `ModelNo`, `SerialNo`, `RegisterNo`, `Manufacturer`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| EquipmentNo | 1960 | 0 | 1959 | text | `RX2-CCP.MODULO-SF-17`<br>`CANTEEN`<br>`CAR PARKING`<br>`GUARD HOUSE`<br>`MEETING ROOM` |
| EquipmentDesc | 1960 | 0 | 326 | text | `CCP MODULO (Inactive date 01/02/2019, Wrong Equipment No)`<br>`CANTEEN AREA`<br>`CAR PARKING AREA`<br>`GUARD HOUSE AREA`<br>`MEETING ROOM` |
| EquipmentType | 1960 | 0 | 94 | text | `SF.CCP.MODULO`<br>`FACILITY`<br>`N/A`<br>`SF.CCP.ONE`<br>`HP.4RC` |
| ModelNo | 1935 | 25 | 180 | text | `MODULO S`<br>`-`<br>`MODULO ONE`<br>`4RACER TBA SWIFT`<br>`OTB80-CNCA2` |
| SerialNo | 1919 | 41 | 1438 | text | `208.557`<br>`-`<br>`212-00024`<br>`220124-05`<br>`220201-03` |
| RegisterNo | 106 | 1854 | 101 | text | `RX2-CCL-SF-02`<br>`RX2-CCL-SF-01`<br>`Sold HOTA`<br>`RX2-CG-SF-62`<br>`RX2-CG-SF-35` |
| RegisterDueDate | 1960 | 0 | 353 | date/timestamp | `01/02/19`<br>`01/01/19`<br>`27/02/25`<br>`13/12/21`<br>`23/03/23` |
| Manufacturer | 1313 | 647 | 33 | text | `MEI`<br>`Optotech AG`<br>`SYSTEC`<br>`Zealway`<br>`A&R` |
| Department | 1960 | 0 | 4 | text | `A`<br>`C`<br>`N/A` |
| Site | 1960 | 0 | 19 | text | `RX2 SURFACE`<br>`GENERAL AFFAIR`<br>`Reserve for undeclare site`<br>`RX1 SURFACE`<br>`RX1 HELP` |
| Location | 1960 | 0 | 162 | numeric | `071`<br>`PUBLIC AREA`<br>`N/A`<br>`004`<br>`091` |
| Active | 1960 | 0 | 2 | text | `No`<br>`Yes` |
| DisposalDate | 1960 | 0 | 2 | date/timestamp | `31/12/98`<br>`31/12/97` |

### Workorder Oct'2025-Jan'2026.csv

- Dataset key: `workorder`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 65
- Data rows: 28238
- Candidate primary keys: `Workorder`
- Candidate foreign keys: `EquipmentNo -> maintenance.equipment.equipment_no`, `Workorder -> maintenance.work_order.workorder_no`
- Date-like columns: `PlanStart`, `PlanFinish`, `ActWorkStart`, `ActWorkEnd`, `RequestDate`, `UDFRQ4`, `UpdateDate`
- Numeric-like columns: `Location`, `LocationDesc`, `Priority`, `PolicyNo`, `EstDuration`, `TotalRepairTime`, `NormalHourUsed`, `DownTime`, `PlanMatCost`, `PlanLaborCost`, `PlanOtherCost`, `ActMatCost`, `ActLabourCost`, `ActOtherCost`, `Satisfaction`, `UDFRQ2`, `UDFRQ3`
- Nullable columns: `PolicyDescription`, `DocID`, `CauseID`, `Reason`, `Solution`, `Reference`, `AccountCode`, `CustomerCode`, `SerialNo`, `HoldReasonCode`, `WarrantyNo`, `Satisfaction`, `SatisfactionNote`, `RequestNo`, `RequestBy`, `UDFRQ1`, `UDFRQ2`, `UDFRQ3`, `UDFRQ4`, `UDFRQ6`, `AssignEmployee`, `ActualEmployee`, `UpdateBy`, `UpdateDate`, `CausePath`, `CauseDescription`, `FailurePath`, `ActionPath`, `ActionDescription`, `EQUDF4`, `AcceptedBy`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| Site | 28238 | 0 | 12 | text | `RX1-FINAL`<br>`RX1-HELP` |
| SiteDesc | 28238 | 0 | 12 | text | `RX1 FINAL INSPECTION`<br>`RX1 HELP` |
| Location | 28238 | 0 | 147 | numeric | `001`<br>`002`<br>`003`<br>`004`<br>`005` |
| LocationDesc | 28238 | 0 | 135 | numeric | `001`<br>`002`<br>`003`<br>`004`<br>`005` |
| Department | 28238 | 0 | 2 | text | `A`<br>`C` |
| DepartmentDesc | 28238 | 0 | 2 | text | `GRADE A`<br>`GRADE C` |
| EquipmentType | 28238 | 0 | 57 | text | `FN.TECO`<br>`FN.XC`<br>`FN.JIGTOOL`<br>`FN.CO2`<br>`FN.SEAL` |
| EquipmentTypeDesc | 28238 | 0 | 51 | text | `TECO PAINT`<br>`X-CUBE RM`<br>`EQUIPMENT, JIG AND TOOL`<br>`LASER MARKER CO2`<br>`SEAL` |
| EquipmentNo | 28238 | 0 | 1278 | text | `RX1-TECO-FN-01`<br>`RX1-XC-FN-06`<br>`RX1-JIGTOOL-FN-01`<br>`RX1-CO2-FN-02`<br>`RX1-CO2-FN-03` |
| EquipmentDesc | 28238 | 0 | 112 | text | `TECO PAINT  (Inactive date  27/06/2025 , Machine stop)`<br>`X-CUBE RM`<br>`EQUIPMENT, JIG AND TOOL`<br>`LASER MARKER CO2 (Inactive date 27/02/2025 , Machine stop)`<br>`LASER MARKER CO2` |
| Workorder | 28238 | 0 | 28238 | text | `PM25-04576`<br>`BMM25-41847`<br>`BMM25-43126`<br>`BMM25-45637`<br>`BMM25-46037` |
| Status | 28238 | 0 | 4 | text | `Cancel`<br>`Complete` |
| Priority | 28238 | 0 | 3 | numeric | `3`<br>`1`<br>`2` |
| PolicyNo | 28238 | 0 | 5 | numeric | `1`<br>`0`<br>`2` |
| PolicyDescription | 28094 | 144 | 25 | text | `เช็คประจำ 6 เดือน`<br>`Other`<br>`เช็คประจำเดือน`<br>`เช็คประจำปี`<br>`งานแจ้งซ่อม` |
| DocID | 14761 | 13477 | 50 | text | `F-PM.PM-X56`<br>`RO`<br>`F-PM.PM-X54`<br>`F-PM.PM-X55`<br>`F-PM.PM-X57` |
| PlanStart | 28238 | 0 | 18459 | date/timestamp | `25/12/2025 08:00:00`<br>`14/10/2025 20:04:00`<br>`26/10/2025 03:29:00`<br>`15/11/2025 22:24:00`<br>`19/11/2025 07:43:00` |
| PlanFinish | 28238 | 0 | 18966 | date/timestamp | `25/12/2025 11:00:00`<br>`14/10/2025 21:04:00`<br>`26/10/2025 04:29:00`<br>`15/11/2025 23:24:00`<br>`19/11/2025 08:43:00` |
| ActWorkStart | 28238 | 0 | 18548 | date/timestamp | `25/12/2025 08:00:00`<br>`14/10/2025 20:04:00`<br>`26/10/2025 06:50:00`<br>`15/11/2025 22:24:00`<br>`19/11/2025 08:00:00` |
| ActWorkEnd | 28238 | 0 | 17063 | date/timestamp | `25/12/2025 11:00:00`<br>`14/10/2025 20:25:00`<br>`26/10/2025 07:30:00`<br>`15/11/2025 22:50:00`<br>`19/11/2025 08:15:00` |
| EstDuration | 28238 | 0 | 9 | numeric | `3`<br>`1`<br>`2`<br>`4`<br>`6` |
| TotalRepairTime | 28238 | 0 | 321 | numeric | `0`<br>`0.35`<br>`0.666666666666667`<br>`0.433333333333333`<br>`0.25` |
| NormalHourUsed | 28238 | 0 | 321 | numeric | `0`<br>`0.35`<br>`0.666666666666667`<br>`0.433333333333333`<br>`0.25` |
| DownTime | 28238 | 0 | 447 | numeric | `0`<br>`0.366666666666667`<br>`4`<br>`0.5`<br>`0.25` |
| CauseID | 0 | 28238 | 0 | text |  |
| PlanMatCost | 28238 | 0 | 1 | numeric | `0` |
| PlanLaborCost | 28238 | 0 | 152 | numeric | `450`<br>`150`<br>`300`<br>`600`<br>`900` |
| PlanOtherCost | 28238 | 0 | 1 | numeric | `0` |
| ActMatCost | 28238 | 0 | 930 | numeric | `0`<br>`161154.1`<br>`420`<br>`840`<br>`4677.39` |
| ActLabourCost | 28238 | 0 | 744 | numeric | `0`<br>`105`<br>`100`<br>`140.83`<br>`37.5` |
| ActOtherCost | 28238 | 0 | 1 | numeric | `0` |
| Note | 28238 | 0 | 12388 | text | `PM Operation`<br>`สายไฟ senser lensvisionขาด`<br>`หมืกไม่ออก`<br>`หน้าจอเครื่องดำ`<br>`PLC TIMEOUT` |
| Reason | 23978 | 4260 | 13514 | text | `สายสัญญาณ sensor arm vacuum หลวม`<br>`file print waveform /inke243 ไม่สมบูรณ์`<br>`โปรแกรมค้าง`<br>`sensor transfer vacuum not on`<br>`sensor transfer vacuum ชำรุด` |
| Solution | 23978 | 4260 | 12817 | text | `ปรับปรุงตัวล็อกสายสัญญาณ sensor arm vacuum ใหม่`<br>`เปลี่ยน file print waveform /InkE243 > InkE239
test print`<br>`ปิด-เปิด โปรแกรมใหม่ 
reset machine`<br>`ขยับ ตำแหน่ง sensor transfer vacuum`<br>`change sensor transfer vacuum 
(use verified part )` |
| Description | 28238 | 0 | 20278 | text | `Cancelled order because of Policy change`<br>`Approved by SERMSAK.NON at 14/10/2025 20:04:32`<br>`Approved by APIWAT.PRA at 26/10/2025 03:29:43`<br>`Approved by NOPPON.HOM at 15/11/2025 22:24:51`<br>`Approved by SANTI.KHU at 19/11/2025 07:43:57` |
| Reference | 39 | 28199 | 35 | text | `Production ขอให้ตรวจสอบว่ามาจากเครื่องไหม`<br>`รอ Engineer Clone disk`<br>`Report S/N No,2 ผิด แก้ NM1910009 เป็น NM1807008`<br>`รอ Madesco มารับเครื่องไปแก้ไข`<br>`รอ Madesco แก้ไขชุดอัดกากใหม่` |
| AccountCode | 28075 | 163 | 15 | text | `RX1 FINAL`<br>`RX1 HELP` |
| CustomerCode | 0 | 28238 | 0 | text |  |
| JobType | 28238 | 0 | 5 | text | `Preventive`<br>`Breakdown Machinery`<br>`Corrective`<br>`Other` |
| SerialNo | 28008 | 230 | 1088 | text | `087`<br>`382`<br>`B042-1`<br>`B052-1`<br>`B068-1` |
| HoldReasonCode | 5 | 28233 | 2 | text | `Sub`<br>`Part` |
| WarrantyNo | 36 | 28202 | 1 | text | `SCHNEIDER` |
| Satisfaction | 23978 | 4260 | 1 | numeric | `3` |
| SatisfactionNote | 37 | 28201 | 33 | text | `gx`<br>`ถอดเ`<br>`v`<br>`ฑำ`<br>`.s,j` |
| RequestNo | 20402 | 7836 | 20402 | text | `RP25-55797`<br>`RP25-57646`<br>`RP25-61132`<br>`RP25-61698`<br>`RP25-61741` |
| RequestBy | 20402 | 7836 | 20 | text | `RX1_FINAL`<br>`NANTASIT.KAE`<br>`RX1_HELP` |
| RequestDate | 28238 | 0 | 20480 | date/timestamp | `25/12/2025 08:00:00`<br>`14/10/2025 20:03:24`<br>`26/10/2025 03:07:17`<br>`15/11/2025 22:24:15`<br>`19/11/2025 07:31:19` |
| UDFRQ1 | 20402 | 7836 | 769 | text | `udom`<br>`UDOM`<br>`AMNAT`<br>`Boworn`<br>`Somsri` |
| UDFRQ2 | 20402 | 7836 | 66 | numeric | `220`<br>`AUTO GENERATED`<br>`211`<br>`Pichet`<br>`221` |
| UDFRQ3 | 20402 | 7836 | 94 | numeric | `0`<br>`-`<br>`1`<br>`AUTO GENERATED` |
| UDFRQ4 | 20402 | 7836 | 18407 | date/timestamp | `14/10/2025 19:57:00`<br>`26/10/2025 03:05:00`<br>`15/11/2025 22:23:00`<br>`19/11/2025 07:29:00`<br>`19/11/2025 11:06:00` |
| UDFRQ6 | 20402 | 7836 | 3 | text | `No Repeat`<br>`Repeat`<br>`AUTO GENERATED` |
| AssignEmployee | 7 | 28231 | 6 | text | `SOMSAK CHAIPRASERT`<br>`ONGART CHOCHOY`<br>`APIWAT KLAINEAM`<br>`CHARAN THAPPAN`<br>`APISIT PRATUMWONG` |
| ActualEmployee | 23978 | 4260 | 364 | text | `APIWATT PRABUNREUNG,SERMSAK NONGKAI`<br>`NOPPON HOMSUK`<br>`NOPPON HOMSUK,PAPHAWIN CHUAPHEANG`<br>`APISIT PRATUMWONG`<br>`APISIT PRATUMWONG,SANTI KHUNBUALA` |
| UpdateBy | 23978 | 4260 | 63 | text | `APIWAT.PRA`<br>`NOPPON.HOM`<br>`APISIT.PRA`<br>`SOMSAK.CHA`<br>`ANUCHIT.YOL` |
| UpdateDate | 23978 | 4260 | 23954 | date/timestamp | `15/10/2025 05:04:34`<br>`26/10/2025 08:37:58`<br>`16/11/2025 03:27:42`<br>`19/11/2025 15:25:51`<br>`19/11/2025 15:29:41` |
| CausePath | 23972 | 4266 | 8 | text | `ERROR`<br>`PART,ELECTRONIC`<br>`PART,CONSUMABLE`<br>`PM CHECK`<br>`PART,PNEUMATIC` |
| CauseDescription | 23978 | 4260 | 9 | text | `ไม่ทำงาน ผิดปกติ เลนส์เสีย`<br>`Part ที่เกี่ยวข้องกับระบบไฟฟ้าเกิดการชำรุด เสียหาย`<br>`Part ที่มีการใช้งานแล้วหมดไปเกิดการชำรุด เสียหาย`<br>`PM CHECK`<br>`Part ที่ใช้ลมหรืออากาศอัดในการทำงานเกิดการชำรุด เสียหาย` |
| FailurePath | 2469 | 25769 | 162 | text | `RX SURFACE,MODULO CENTER ONE,Control voltage`<br>`GENERAL,F003,038`<br>`GENERAL,F003,033`<br>`RX SURFACE,CURVE GENERATOR,Change tool,Fine cutting`<br>`RX SURFACE,CURVE GENERATOR,ERROR CODE,1001/52` |
| FailureDescription | 28238 | 0 | 12342 | text | `PM Operation`<br>`สายไฟ senser lensvisionขาด`<br>`หมืกไม่ออก`<br>`หน้าจอเครื่องดำ`<br>`PLC TIMEOUT` |
| ActionPath | 4113 | 24125 | 6 | text | `Use verified part`<br>`PM CHECK`<br>`Yearly PM Service` |
| ActionDescription | 23978 | 4260 | 12817 | text | `ปรับปรุงตัวล็อกสายสัญญาณ sensor arm vacuum ใหม่`<br>`เปลี่ยน file print waveform /InkE243 > InkE239
test print`<br>`ปิด-เปิด โปรแกรมใหม่ 
reset machine`<br>`ขยับ ตำแหน่ง sensor transfer vacuum`<br>`change sensor transfer vacuum 
(use verified part )` |
| FuncLocation | 28238 | 0 | 1307 | text | `RX1-FINAL,001,A,FN.TECO`<br>`RX1-FINAL,001,A,FN.XC`<br>`RX1-FINAL,001,C,FN.JIGTOOL`<br>`RX1-FINAL,002,A,FN.CO2`<br>`RX1-FINAL,003,A,FN.CO2` |
| EQUDF4 | 0 | 28238 | 0 | text |  |
| AcceptedBy | 23611 | 4627 | 1242 | text | `นาาจ/chief`<br>`อำนาจ/foreman`<br>`ฺBowon / Foreman`<br>`Foreman บวร`<br>`ฺBovon / foreman` |

### Task Oct'2025-Jan'2026.csv

- Dataset key: `task`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 8
- Data rows: 207091
- Candidate primary keys: `Workorder + TaskNo`
- Candidate foreign keys: `Workorder -> maintenance.work_order.workorder_no`
- Date-like columns: none detected
- Numeric-like columns: `TaskNo`
- Nullable columns: `Value`, `Reference`, `Authorizer`, `RequestNo`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| Workorder | 207091 | 0 | 7836 | text | `PM25-00022`<br>`PM25-00023`<br>`PM25-00035`<br>`PM25-00036`<br>`PM25-00037` |
| TaskNo | 207091 | 0 | 112 | numeric | `1`<br>`2`<br>`3`<br>`4`<br>`5` |
| Description-1 | 207091 | 0 | 1468 | text | `Cleaning entire machine and cover (ทำความสะอาดชิ้นส่วนภายนอก และภายในเครื่องจักร)`<br>`Cleaning cable, air hose, and coolant hose. (ทำความสะอาดสายไฟ สายลม ท่อน้ำหล่อเย็น และอุปกรณ์อื่นๆของเครื่องจักร)`<br>`Checking for damaged drive belt or looseness. (ตรวจสอบสภาพและความตึงของสายพาน)`<br>`Checking for any damaged or worn out of pneumatic parts and cylinder. (ตรวจสอบการชำรุดและการรั่วไหลของอุปกรณ์นิวเมติกส์)`<br>`Checking for any damaged or worn out of splash guard. (ตรวจสอบสภาพของแผ่นพลาสติกป้องกันน้ำยาของสปินเดิ้ลด้านบน ( Splash guard ))` |
| Description-2 | 207091 | 0 | 460 | text | `สภาพปกติ , ไม่ชำรุด`<br>`(0.000-5.000 Ω )`<br>`(1.2-3.0 kgf.)`<br>`(2.1-3.9 kgf.)`<br>`(3.1-4.9 kgf.)` |
| Value | 101374 | 105717 | 6401 | text | `สภาพปกติ,ไม่ชำรุด`<br>`สะอาด`<br>`สภาพปกติ`<br>`ใช้งานได้ปกติ,ไม่ชำรุด`<br>`0.2` |
| Reference | 26 | 207065 | 15 | text | `Uncut`<br>`เปลี่ยนเเขนประตู พร้อม Bearing แกนประตู`<br>`Service report No.Rx1 NJS-750 report`<br>`Service report RX1 NJS-750 report.pdf`<br>`service report RX1 NJS-750 report.pdf` |
| Authorizer | 52207 | 154884 | 1 | text | `Administrator` |
| RequestNo | 0 | 207091 | 0 | text |  |

### Transaction Oct'2025-Jan'2026.csv

- Dataset key: `transaction`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 18
- Data rows: 5149
- Candidate primary keys: none detected; use surrogate key
- Candidate foreign keys: `WorkOrder -> maintenance.work_order.workorder_no`, `EquipmentNo -> maintenance.equipment.equipment_no`, `CatalogueNo -> maintenance.part_catalog.catalogue_no`, `WarehouseID -> maintenance.warehouse.warehouse_code/location`, `WarehouseLocationID -> maintenance.warehouse.warehouse_code/location`
- Date-like columns: `TransactionDate`
- Numeric-like columns: `TranQty`
- Nullable columns: `SerialNo`, `Comment2`, `Comment3`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| TransactionDate | 5149 | 0 | 3631 | date/timestamp | `01/10/2025 03:00:02`<br>`01/10/2025 04:11:09`<br>`01/10/2025 05:36:40`<br>`01/10/2025 08:45:47`<br>`01/10/2025 10:30:54` |
| WorkOrder | 5149 | 0 | 3487 | text | `BMM25-40169`<br>`BMM25-40165`<br>`BMM25-40178`<br>`BMM25-40197`<br>`BMM25-40213` |
| EquipmentNo | 5149 | 0 | 749 | text | `RX2-MEI-HP-07`<br>`RX1-ATAPE-SF-03`<br>`RX2-CG-SF-24`<br>`RX1-MBLOCK-SF-24`<br>`RX2-CCP.SWIFT-SF-09` |
| EquipmentDesc | 5149 | 0 | 48 | text | `BISPHERA-XDD MEI`<br>`AUTO TAPE APPLICATOR`<br>`CURVE GENERATOR`<br>`MANUAL ALLOY BLOCKER`<br>`CCP SWIFT` |
| CatalogueNo | 5149 | 0 | 791 | text | `HP.MEI-EN-024`<br>`SF.ATAPE-ME-003`<br>`SF.ATAPE-ME-009`<br>`SF.CG-ME-SMX-008`<br>`SF.ABLOCK-CS-004` |
| PartName | 5149 | 0 | 788 | text | `0000008082 Linear Movement Sensor (SM222 20.2.SX61)`<br>`Blade support (520)`<br>`Replacement blades,p.u. 10 pcs (N/8168)`<br>`Collet chuck D43/M10(101-45-001) TSHSC8.3`<br>`Silicon hose alloy valve ø2/4 (03070130000204)` |
| TransactionType | 5149 | 0 | 2 | text | `ISSUE`<br>`RECEIVE` |
| TranQty | 5149 | 0 | 18 | numeric | `1`<br>`0.02`<br>`2`<br>`4`<br>`3` |
| UOM | 5149 | 0 | 6 | text | `PCS`<br>`M` |
| SerialNo | 0 | 5149 | 0 | text |  |
| WarehouseID | 5149 | 0 | 8 | text | `RX-HELPFINAL`<br>`RX1-SURFACE`<br>`RX2-SURFACE`<br>`RX3-SURFACE`<br>`RX2-TINT` |
| WarehouseLocationID | 5149 | 0 | 8 | text | `RX-HELPFINAL`<br>`RX1-SURFACE`<br>`RX2-SURFACE`<br>`RX3-SURFACE`<br>`RX2-TINT` |
| Comment1 | 5149 | 0 | 221 | text | `เปลี่ยน part ตามใบงาน`<br>`เปลี่ยนPart ตามใบงาน`<br>`เบิก Part ใส่เครื่อง`<br>`้เปลี่ยน Part ตามใบงาน`<br>`เปลี่ยน Part ตามใบงาน` |
| Comment2 | 4998 | 151 | 169 | text | `ืnoppon`<br>`Chukiat`<br>`KITTICHAI`<br>`Chatree`<br>`ดอกรัง` |
| Comment3 | 4971 | 178 | 797 | text | `01/10/2025`<br>`1/10/2025`<br>`01-OCT-2025`<br>`01/102025`<br>`ศักดา` |
| UserID | 5149 | 0 | 62 | text | `NOPPON.HOM`<br>`CHUKIAT.PIK`<br>`KITTICHAI.ANO`<br>`CHATREE.CHA`<br>`DOKRANG.NOY` |
| FirstName | 5149 | 0 | 60 | text | `NOPPON`<br>`CHUKIAT`<br>`KITTICHAI`<br>`CHATREE`<br>`DOKRANG` |
| LastName | 5149 | 0 | 61 | text | `HOMSUK`<br>`PIKULKAW`<br>`ANOPAN`<br>`CHANKASEM`<br>`NOYNA` |

### HoldWorkorderHistory.csv

- Dataset key: `hold_workorder_history`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 14
- Data rows: 68
- Candidate primary keys: none detected; use surrogate key
- Candidate foreign keys: `WorkOrder -> maintenance.work_order.workorder_no`, `EquipmentNo -> maintenance.equipment.equipment_no`
- Date-like columns: `HoldDate2`, `PlanStart`, `PlanFinish`
- Numeric-like columns: `Location`
- Nullable columns: `EquipmentType`, `OperatorID`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| HoldDate2 | 68 | 0 | 43 | date/timestamp | `02/10/2025`<br>`16/12/2025`<br>`15/12/2025`<br>`02/01/2026`<br>`14/01/2026` |
| WorkOrder | 68 | 0 | 63 | text | `BMM25-40270`<br>`BMM25-49230`<br>`BMM25-47945`<br>`BMM25-48251`<br>`BMM26-01676` |
| FuncLocation | 68 | 0 | 53 | text | `RX1-HELP,001,A,HP.4RC`<br>`RX1-SURFACE,1074,A,SF.ABLOCK`<br>`RX1-TINT,009,A,TN.AC`<br>`RX1-TINT,014,A,TN.AC`<br>`RX1-TINT,003,C,TN.BO` |
| EquipmentNo | 68 | 0 | 53 | text | `RX1-4RC-HP-07`<br>`RX1-ABLOCK-SF-13`<br>`RX1-AC-TN-09`<br>`RX1-AC-TN-14`<br>`RX1-BO-TN-03` |
| EquipmentDesc | 68 | 0 | 25 | text | `4RACER TBA SWIFT MEI`<br>`AUTO ALLOY BLOCKER`<br>`AUTO CLAVE`<br>`BATCH OVEN`<br>`EZLINE DUAL` |
| HoldReasonDescription2 | 68 | 0 | 5 | text | `รออะไหล่ (Insufficient Spare Parts)`<br>`รอช่างผู้ชำนาญการ Service center`<br>`ขาดแคลนเจ้าหน้าที่ (Staff working on other tasks, staff leave)`<br>`Textbox41`<br>`*` |
| PlanStart | 68 | 0 | 48 | date/timestamp | `01/10/2025`<br>`16/12/2025`<br>`05/12/2025`<br>`08/12/2025`<br>`14/01/2026` |
| PlanFinish | 68 | 0 | 48 | date/timestamp | `01/10/2025`<br>`16/12/2025`<br>`05/12/2025`<br>`08/12/2025`<br>`14/01/2026` |
| HoldBy | 68 | 0 | 18 | text | `PATTADON TARANPANYAPAT`<br>`SANAN SACHAIYAN`<br>`ANUPOT SUBMEK`<br>`NANTASIT KAEWMEESEE`<br>`PAKRUETAI SAISAMUT` |
| Site | 68 | 0 | 12 | text | `RX1-HELP`<br>`RX1-SURFACE`<br>`RX1-TINT`<br>`RX2-TINT`<br>`RX2-FINAL` |
| Location | 68 | 0 | 37 | numeric | `001`<br>`1074`<br>`009`<br>`014`<br>`003` |
| Department | 68 | 0 | 4 | text | `A`<br>`C`<br>`Textbox68`<br>`31/01/2026` |
| EquipmentType | 66 | 2 | 23 | text | `HP.4RC`<br>`SF.ABLOCK`<br>`TN.AC`<br>`TN.BO`<br>`HP.EZ` |
| OperatorID | 66 | 2 | 7 | text | `RX-HELPFINAL`<br>`RX1-SURFACE`<br>`RX1-TINT`<br>`RX2-TINT`<br>`RX2-SURFACE` |

### CatalogueItemsReport.csv

- Dataset key: `catalogue_items`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 18
- Data rows: 3989
- Candidate primary keys: `CatalogueNo`, `CatalogueNo + Warehouse + BinLocation`
- Candidate foreign keys: `CatalogueNo -> maintenance.part_catalog.catalogue_no`, `Warehouse -> maintenance.warehouse.warehouse_code/location`
- Date-like columns: none detected
- Numeric-like columns: `Cost`, `OnHand`, `OnOrder`, `MAX`, `ROP`, `MIN`, `ROQ`
- Nullable columns: `BinLocation`, `Type`, `AccountNo`, `Class`, `Cost`, `UOM`, `OnHand`, `OnOrder`, `MAX`, `ROP`, `MIN`, `ROQ`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| Textbox34 | 3989 | 0 | 3 | text | `ROP` |
| Textbox32 | 3989 | 0 | 3 | text | `ROQ` |
| CatalogueNo | 3989 | 0 | 3989 | text | `FN.AR-CS-001`<br>`FN.AR-CS-002`<br>`FN.AR-CS-003`<br>`FN.AR-CS-004`<br>`FN.AR-CS-005` |
| PartName | 3989 | 0 | 3962 | text | `Gripper Finger <NEOPRENE> (3802471-0)`<br>`Special Treated Vacuum Cup (3803083-1)`<br>`Tubing DIA6,Soft PU (SMCTUS0604N-1M)`<br>`Tubing PTFE DIA6 Heat Resist (SMCTD0604-1M)`<br>`Special Treated Vacuum Cup (3803083-2)` |
| CatalogueGroup | 3989 | 0 | 6 | text | `CONSUMABLE`<br>`ELECTRONIC`<br>`MECHANIC`<br>`PNEUMATIC` |
| Warehouse | 3989 | 0 | 7 | text | `PRODUCTION`<br>`RX-HELPFINAL` |
| BinLocation | 3987 | 2 | 5 | text | `PRODUCTION`<br>`RX-HELPFINAL` |
| Type | 3987 | 2 | 2 | text | `Spare Part` |
| AccountNo | 1 | 3988 | 1 | text | `RX1 FFS` |
| Class | 3987 | 2 | 18 | text | `A`<br>`B`<br>`C`<br>`ิB`<br>`ฺB` |
| Cost | 3987 | 2 | 2423 | numeric | `209.00`<br>`1,045.00`<br>`0.00`<br>`1,291.67`<br>`1,100.00` |
| UOM | 3987 | 2 | 9 | text | `PCS`<br>`SET`<br>`M`<br>`pcs` |
| OnHand | 3987 | 2 | 155 | numeric | `0`<br>`4`<br>`2`<br>`7`<br>`35` |
| OnOrder | 3987 | 2 | 21 | numeric | `0` |
| MAX | 3987 | 2 | 25 | numeric | `0`<br>`10`<br>`2`<br>`5`<br>`1` |
| ROP | 3987 | 2 | 23 | numeric | `0`<br>`5`<br>`1`<br>`2` |
| MIN | 3987 | 2 | 17 | numeric | `0`<br>`5`<br>`1`<br>`2` |
| ROQ | 3987 | 2 | 19 | numeric | `1`<br>`5`<br>`2` |

### StockValuationReport.csv

- Dataset key: `stock_valuation`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 19
- Data rows: 37967
- Candidate primary keys: none detected; use surrogate key
- Candidate foreign keys: `CatalogueNo -> maintenance.part_catalog.catalogue_no`
- Date-like columns: none detected
- Numeric-like columns: `MIN`, `MAX`, `ROP`, `OnHand`, `VALUE`, `BatchNo`, `Qty`, `UnitPrice`, `Textbox13`, `Textbox2`, `Textbox17`, `Textbox51`
- Nullable columns: `ROP`, `OnHand`, `VALUE`, `BatchNo`, `SerialNo`, `Qty`, `UnitPrice`, `Textbox13`, `Textbox2`, `Textbox17`, `Textbox54`, `Textbox51`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| Textbox34 | 37967 | 0 | 11 | text | `PRODUCTION PRODUCTION` |
| CatalogueNo | 37967 | 0 | 4081 | text | `HP.NDE.EN-012`<br>`HP.NDE-ME-019`<br>`F.TECO-CS-006`<br>`FN.AR-CS-001`<br>`FN.AR-CS-004` |
| PartName | 37967 | 0 | 3992 | text | `Cat.No. Mistake`<br>`REFLECTING SHEET (802 00 004)`<br>`Gripper Finger <NEOPRENE> (3802471-0)`<br>`Tubing PTFE DIA6 Heat Resist (SMCTD0604-1M)`<br>`Fiber Optic Sensor (SICK_LL3-DM01) AR Block M/C` |
| UOM | 37967 | 0 | 11 | text | `PCS`<br>`M`<br>`SET` |
| BinLocation | 37967 | 0 | 11 | text | `PRODUCTION` |
| MIN | 37967 | 0 | 19 | numeric | `0.00`<br>`1.00`<br>`2.00`<br>`5.00`<br>`50.00` |
| MAX | 37967 | 0 | 27 | numeric | `0.00`<br>`1.00`<br>`2.00`<br>`6.00`<br>`3.00` |
| ROP | 37965 | 2 | 23 | numeric | `0.00`<br>`1.00`<br>`2.00`<br>`3.00`<br>`8.00` |
| OnHand | 37965 | 2 | 145 | numeric | `0.00`<br>`10.00`<br>`50.00`<br>`6.00`<br>`1.00` |
| VALUE | 37965 | 2 | 2829 | numeric | `0.00`<br>`6,220.00`<br>`30,500.00`<br>`67,212.84`<br>`29,000.00` |
| BatchNo | 37965 | 2 | 36278 | numeric | `6636`<br>`6637`<br>`8909`<br>`16783`<br>`33130` |
| SerialNo | 0 | 37967 | 0 | text |  |
| Qty | 37965 | 2 | 128 | numeric | `0.00`<br>`10.00`<br>`50.00`<br>`6.00`<br>`1.00` |
| UnitPrice | 37965 | 2 | 2657 | numeric | `1,028.00`<br>`0.00`<br>`130.00`<br>`3,220.00`<br>`1,901.00` |
| Textbox13 | 37965 | 2 | 3463 | numeric | `0.00`<br>`6,220.00`<br>`30,500.00`<br>`67,212.84`<br>`29,000.00` |
| Textbox2 | 37965 | 2 | 145 | numeric | `0.00`<br>`10.00`<br>`50.00`<br>`6.00`<br>`1.00` |
| Textbox17 | 37965 | 2 | 2829 | numeric | `0.00`<br>`6,220.00`<br>`30,500.00`<br>`67,212.84`<br>`29,000.00` |
| Textbox54 | 37965 | 2 | 9 | text | `PRODUCTION` |
| Textbox51 | 37965 | 2 | 9 | numeric | `1,062,012.76` |

### ReportTransactionHistory.csv

- Dataset key: `transaction_history`
- Encoding: UTF-8 with BOM
- Delimiter: `,`
- Header row: 1
- Columns: 18
- Data rows: 8189
- Candidate primary keys: none detected; use surrogate key
- Candidate foreign keys: `CatalogueNO -> maintenance.part_catalog.catalogue_no`, `WarehouseID -> maintenance.warehouse.warehouse_code/location`, `WarehouseLocationID -> maintenance.warehouse.warehouse_code/location`
- Date-like columns: `TransactionDate`
- Numeric-like columns: `BatchNo`, `TranQty`, `TranValue`, `RunTotal`, `Textbox38`, `Textbox47`, `Textbox61`
- Nullable columns: `SerialNo`, `WarehouseLocationID`, `Textbox27`, `Comment1`, `UserID`, `Textbox38`, `Textbox47`, `Textbox61`

| Column | Non-null | Nulls | Distinct | Type hint | Examples |
| --- | ---: | ---: | ---: | --- | --- |
| TransactionDate | 8189 | 0 | 4433 | date/timestamp | `01/10/25  01:42`<br>`01/10/25  02:56`<br>`01/10/25  02:58`<br>`01/10/25  03:00`<br>`01/10/25  04:11` |
| CatalogueNO | 8189 | 0 | 1292 | text | `SF.CCP.ONE-CS-003`<br>`HP.MEI-PN-019`<br>`HP.MEI-ME-031`<br>`HP.MEI-EN-024`<br>`SF.ATAPE-ME-003` |
| PartName | 8189 | 0 | 1284 | text | `Tool holder : CCP One`<br>`0000008073 Cylinder DSNU-25-330-P-A (14327)`<br>`B32 13 044-KIT Kit of 4 Spring for Holder Carter`<br>`0000008082 Linear Movement Sensor (SM222 20.2.SX61)`<br>`Blade support (520)` |
| TransactionType | 8189 | 0 | 4 | text | `ISSUE`<br>`RECEIVE` |
| BatchNo | 8189 | 0 | 3086 | numeric | `31345`<br>`28841`<br>`29447`<br>`19837`<br>`32911` |
| TranQty | 8189 | 0 | 55 | numeric | `1.00`<br>`2.00`<br>`30.00`<br>`0.02`<br>`3.00` |
| TranValue | 8189 | 0 | 1760 | numeric | `3,500.00`<br>`3,090.00`<br>`538.00`<br>`14,498.00`<br>`5,276.91` |
| RunTotal | 8189 | 0 | 353 | numeric | `12.00`<br>`2.00`<br>`458.00`<br>`4.00`<br>`24.00` |
| UOM | 8189 | 0 | 10 | text | `PCS`<br>`M`<br>`ROL` |
| SerialNo | 2 | 8187 | 2 | text | `Textbox151`<br>`*` |
| WarehouseID | 8189 | 0 | 10 | text | `RX1-SURFACE`<br>`RX-HELPFINAL`<br>`RX2-SURFACE`<br>`RX3-SURFACE` |
| WarehouseLocationID | 8187 | 2 | 8 | text | `RX1-SURFACE`<br>`RX-HELPFINAL`<br>`RX2-SURFACE`<br>`RX3-SURFACE` |
| Textbox27 | 8187 | 2 | 3484 | text | `BMM25-40157`<br>`BMM25-40158`<br>`BMM25-40169`<br>`BMM25-40165`<br>`BMM25-40162` |
| Comment1 | 8187 | 2 | 509 | text | `เปลี่ยน part ตามใบงาน`<br>`เปลี่ยนPart ตามใบงาน`<br>`เบิกตามใบงาน`<br>`เบิก Part ใส่เครื่อง`<br>`เบิก Part ตามใบงาน` |
| UserID | 8187 | 2 | 68 | text | `SUPACHAI.SEE`<br>`NOPPON.HOM`<br>`CHUKIAT.PIK`<br>`PAKON.KAT`<br>`KITTICHAI.ANO` |
| Textbox38 | 8187 | 2 | 1 | numeric | `53,227,075.99` |
| Textbox47 | 8187 | 2 | 1 | numeric | `46,516,682.54` |
| Textbox61 | 8187 | 2 | 1 | numeric | `605,853.44` |

