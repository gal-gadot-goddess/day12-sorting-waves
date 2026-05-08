
export interface AlgoStep {
    index: number | null;
    foundIndex: number | null;
    range: [number, number];
    description: string;
}

export interface ArrayElement {
    value: number;
    id: string;
}
