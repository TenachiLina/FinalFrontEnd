export interface Employee {
  id: number;
  user: {
    image: string;
    name: string;
    PhoneNumber: string;
  };
  position: string;
  salary: string;
  Address: string;
  status: "Vacation" | "In Progress";
}