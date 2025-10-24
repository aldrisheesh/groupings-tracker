import { Group } from "../App";

export function exportGroupsToCSV(groups: Group[], subjectName: string, groupingTitle: string) {
  // Create CSV header
  const headers = ["Group Name", "Member Limit", "Current Members", "Status", "Representative", "Members List"];
  
  // Create CSV rows
  const rows = groups.map(group => {
    const isFull = group.members.length >= group.memberLimit;
    const status = isFull ? "Full" : "Available";
    const representative = group.representative || "None";
    const membersList = group.members.sort((a, b) => a.localeCompare(b)).join("; ");
    
    return [
      group.name,
      group.memberLimit.toString(),
      group.members.length.toString(),
      status,
      representative,
      membersList
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  // Add UTF-8 BOM to ensure proper encoding for special characters
  const BOM = "\uFEFF";
  const csvContentWithBOM = BOM + csvContent;
  
  // Create blob with explicit UTF-8 encoding
  const blob = new Blob([csvContentWithBOM], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  const fileName = `${subjectName}_${groupingTitle}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_groups_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}