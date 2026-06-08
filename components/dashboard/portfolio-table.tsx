import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PortfolioProject {
  id: string;
  name: string;
  noOfTokens: number;
  tokenValue: number;
  totalValue: number;
  fulfilment: number;
}

interface PortfolioTableProps {
  projects: PortfolioProject[];
}

export function PortfolioTable({ projects }: PortfolioTableProps) {
  return (
    <div className="overflow-hidden rounded-xl ">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent bg-card">
            <TableHead className="py-4 font-medium text-muted-foreground">Project</TableHead>
            <TableHead className="py-4 text-center font-medium text-muted-foreground">No. of tokens</TableHead>
            <TableHead className="py-4 text-center font-medium text-muted-foreground">Token value</TableHead>
            <TableHead className="py-4 text-center font-medium text-muted-foreground">Total value</TableHead>
            <TableHead className="py-4 text-center font-medium text-muted-foreground">Fulfilled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableCell colSpan={5} className="py-8 text-center ">
                  <span className="text-base text-foreground">
                    You don&apos;t have any projects yet.
                  </span>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-16 "></TableCell>
              </TableRow>
            </>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} className="border-b border-border ">
                <TableCell className="py-4 font-medium">{project.name}</TableCell>
                <TableCell className="py-4 text-center">{project.noOfTokens}</TableCell>
                <TableCell className="py-4 text-center">
                  ${project.tokenValue.toLocaleString()}
                </TableCell>
                <TableCell className="py-4 text-center">
                  ${project.totalValue.toLocaleString()}
                </TableCell>
                <TableCell className="py-4 text-center">{project.fulfilment}%</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
