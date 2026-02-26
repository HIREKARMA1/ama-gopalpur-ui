# Anganwadi Centre Dashboard (AwcPortfolioDashboard)

This document provides a breakdown of the data fields displayed on the `AwcPortfolioDashboard.tsx` component, including which fields are currently supplied dynamically by the database schema via the `awcProfile` object, and which fields are hardcoded placeholders (demo data).

## Data Schema & Mapping Overview

### 1. Database Sourced Data ✅ (Available in Schema)

| UI Section | UI Label | Backend / Schema Field | Description |
| :--- | :--- | :--- | :--- |
| **Top Summary Row** | Org Name | `org.name` | The primary name of the Anganwadi Centre facility. |
| | Centre Type | `center_type` | The classification of the centre (e.g., Main Centre). |
| | Location Block | `block_name` | The geographic location block (e.g., Namkum Block). |
| | Established | `establishment_year` | The year the facility was established. |
| **Centre Profile** | BLOCK / ULB | `block_name` | Geographic block name. |
| | GP / WARD | `gp_ward` | Gram Panchayat or Ward assignment. |
| | VILLAGE | `village_name` | Village the centre operates in. |
| | NAME OF AWC | `name_of_awc` | Specific local name for the centre. |
| | AWC ID | `awc_code` | Unique ID or registration code for the AWC. |
| | BUILDING STATUS | `building_status` | Status of the building structure itself. |
| | LATITUDE | `latitude` | GPS latitude coordinates. |
| | LONGITUDE | `longitude` | GPS longitude coordinates. |
| | DESCRIPTION | `remarks` | Additional remarks about the centre. |
| **Staff & Contact** | CPDO NAME | `cpdo_name` | Name of the Child Project Development Officer. |
| | CPDO CONTACT NO | `cpdo_contact` | Contact number for CPDO. |
| | SUPERVISOR NAME | `supervisor_name` | Name of the assigned supervisor. |
| | SUPERVISOR CONTACT | `supervisor_contact` | Contact number for the supervisor. |
| | AWW NAME | `aww_name` | Name of the Anganwadi Worker (AWW). |
| | AWW CONTACT NO | `aww_contact` | Contact number for the AWW. |
| | AWH NAME | `awh_name` | Name of the Anganwadi Helper (AWH). |
| | AWH CONTACT NO | `awh_contact` | Contact number for the AWH. |
| | CENTRE CONTACT | `centre_contact` | Facility line contact number (sometimes missing). |

---

### 2. Missing Data / Hardcoded Demo Data ❌ (Requires Schema Updates)
The following sections of the UI are currently constructed using hardcoded dummy data. To make these dynamic, the following specific fields or aggregate data pipelines need to be added to the database schema (e.g., inside the `OrganizationProfile` or related Awc metric tables).

| UI Section & Metric | Proposed Schema Field / Logic | Description & Trend Logic Needs |
| :--- | :--- | :--- |
| **Main KPIs:** Total Enrollment | `total_enrollment` | Total children enrolled. Needs historical tracking (`previous_month_enrollment`) for the trend arrow. |
| **Main KPIs:** Attendance Rate | `average_attendance_rate` | Needs daily logs to calculate `(present/total)*100`. Trend requires `previous_month_attendance_rate`. |
| **Main KPIs:** Health Checkups | `health_checkups_completed` | Month-to-date count. Trend requires `previous_month_health_checkups`. |
| **Main KPIs:** Total Shortage | `total_shortage_count` | Sum total of inventory/infrastructure shortages directly from an associated requirements table. |
| **Infra Summary:** Capabilities | `current_capacity`, `max_capacity` | Fields defining student limits, etc., for the AWC, nearby Schools, Libraries, and Kitchens. |
| **Infra Summary:** Status Badges | `operational_status` | ENUM per facility entity (`'Functional'`, `'Partial'`, `'Non-functional'`). |
| **Infra Summary:** Aggregate Counters| *Dynamic Aggregation* | Backend logic grouping all linked infrastructures by `operational_status`. |
| **Resource Status:** Category Setup | `resource_type` | Inventory table structure needed for `Infrastructure`, `Seats`, `Meals`, `Books`, etc. |
| **Resource Status:** Quantities | `quantity_available` & `required` | Base fields required to mathematically calculate *Availability %* and remaining *Shortage* in the UI. |
| **MoM Metrics:** Historical Logs | `MonthlyMetricsLog` Table | Needed to capture historical states month-to-month. |
| **MoM Metrics:** Bar Chart Needs | Chart Data Array | Requires values across all 8 metrics (`enrollment`, `attendance`, `budget_utilization`, etc.) for building the chart visualization dynamically. |
| **MoM Metrics:** Highlights Box | `current` vs `previous_month` | Backend calculation required to dynamically select the `best_performer_metric_name`, calculate `metrics_improved_count`, and the overall `average_improvement_percentage`. |
