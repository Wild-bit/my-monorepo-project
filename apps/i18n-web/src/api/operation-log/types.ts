export interface OperationLogItem {
  id: string;
  operationType: string;
  operationContent: string;
  operationAt: string;
  operator: {
    id: string;
    name: string;
    avatar?: string;
  };
}
