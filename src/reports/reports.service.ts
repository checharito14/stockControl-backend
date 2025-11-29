import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  create(createReportDto: CreateReportDto) {
    return 'This action adds a new report';
  }

  findAll(userId: number) {
    return this.reportRepository.find({
      where: { userId },
      order: { generatedAt: 'DESC' },
    });
  }

  findOne(id: number, userId: number) {
    return this.reportRepository.findOne({
      where: { id, userId },
    });
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }
}
