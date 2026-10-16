import { Request, Response } from 'express';
import * as loanService from './loanService';
import type {
  LoanDetail,
  Loan,
  CreateLoanDTO,
  GetLoanSummaryMetricsParams,
  LoanSummaryMetrics,
  GetLoansParams
} from '@LibSoft/shared-types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import camelcaseKeys from 'camelcase-keys';

export const getLoans = async (
  req: Request<GetLoansParams>,
  res: Response,
) => {
  try {
    const {
      borrowerIds,
      copiesIds,
      borrowerName,
      status,
      sortBy,
      startDate,
      endDate,
      limit,
      offset
    } = req.query;

    console.log("getLoans reqQuery: ");
    console.log(req.query);

    const filters: GetLoansParams = {
      borrowerIds: borrowerIds ? (Array.isArray(borrowerIds) ? borrowerIds as string[] : String(borrowerIds).split(',')) : undefined,
      copiesIds: copiesIds ? (Array.isArray(copiesIds) ? copiesIds as string[] : String(copiesIds).split(',')) : undefined,
      borrowerName: borrowerName ? String(borrowerName) : undefined,
      status: status ? String(status) as any : undefined,
      sortBy: sortBy ? String(sortBy) as any : undefined,
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
    };

    const data = await loanService.getLoans(filters);
    res.json(camelcaseKeys(data, { deep: true }));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLoansCount = async (
  req: Request,
  res: Response<{ total: number } | { message: string }>
) => {
  try {
    const count = await loanService.getLoansCount();
    res.json(camelcaseKeys(count, { deep: true }));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export const getLoanById = async (
  req: Request,
  res: Response<LoanDetail | { message: string }>
) => {
  try {
    const { id } = req.params;
    const lang = req.headers['accept-language']?.split(',')[0] || 'en';
    const loan = await loanService.getLoanById(id as string, lang as string);
    if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });
    res.json(camelcaseKeys(loan, { deep: true }));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLoan = async (
  req: AuthenticatedRequest & Request<unknown, unknown, CreateLoanDTO>,
  res: Response<LoanDetail | { message: string }>
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Sesión requerida' });
    }
    const loan = await loanService.createLoan(req.body, req.user.id, req);
    res.status(201).json(camelcaseKeys(loan, { deep: true }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const returnLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { copyIds, copies } = req.body;
    const loan = await loanService.returnLoan(id as string, copies || copyIds);
    res.json(camelcaseKeys(loan, { deep: true }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReturnMetricsByMonth = async (req: Request, res: Response) => {
  try {
    const { monthsBack } = req.query;
    const metrics = await loanService.getReturnMetricsByMonth(String(monthsBack));
    res.json(camelcaseKeys(metrics, { deep: true }));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export const getLoanSummaryMetrics = async (
  req: Request,
  res: Response<LoanSummaryMetrics | { message: string }>
) => {
  try {
    const { borrowerId, startDate, endDate } = req.query;

    const params: GetLoanSummaryMetricsParams = {
      borrowerId: borrowerId ? String(borrowerId) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    };

    const metrics = await loanService.getLoanSummaryMetrics(params);
    res.json(camelcaseKeys(metrics, { deep: true }));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export const deleteLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await loanService.deleteLoan(id as string);
    res.json(camelcaseKeys(loan, { deep: true }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};