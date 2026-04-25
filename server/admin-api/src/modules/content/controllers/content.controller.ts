import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { ContentStatus, LinkType } from '@prisma/client';

export async function getBanners(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { status } = req.query;

  const now = new Date();
  const where: Prisma.BannerWhereInput = {};
  if (status) {
    where.status = status as ContentStatus;
  } else {
    where.status = 'ACTIVE';
    where.OR = [
      { startTime: null, endTime: null },
      { startTime: { lte: now }, endTime: null },
      { startTime: null, endTime: { gte: now } },
      { startTime: { lte: now }, endTime: { gte: now } },
    ];
  }

  const [total, list] = await Promise.all([
    prisma.banner.count({ where }),
    prisma.banner.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}

export async function createBanner(req: Request, res: Response) {
  const body = req.body;
  const { title, imageUrl, linkType, linkValue, sortOrder, status, startTime, endTime } = body;

  if (!title || !imageUrl) {
    res.status(400).json(badRequest('标题和图片不能为空'));
    return;
  }

  const result = await prisma.banner.create({
    data: {
      title,
      imageUrl,
      linkType: (linkType as LinkType) || 'NONE',
      linkValue: linkValue || null,
      sortOrder: sortOrder || 0,
      status: (status as ContentStatus) || 'ACTIVE',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    },
  });

  res.json(success(result, '创建成功'));
}

export async function updateBanner(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的 Banner ID'));
    return;
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('Banner 不存在'));
    return;
  }

  const { title, imageUrl, linkType, linkValue, sortOrder, status, startTime, endTime } = req.body;

  const result = await prisma.banner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(linkType !== undefined && { linkType }),
      ...(linkValue !== undefined && { linkValue }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(status !== undefined && { status }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
    },
  });

  res.json(success(result, '更新成功'));
}

export async function deleteBanner(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的 Banner ID'));
    return;
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('Banner 不存在'));
    return;
  }

  await prisma.banner.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}

// ==================== 公告 ====================

export async function getNotices(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const [total, list] = await Promise.all([
    prisma.notice.count(),
    prisma.notice.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}

export async function getNoticeById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的公告 ID'));
    return;
  }

  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) {
    res.status(404).json(notFound('公告不存在'));
    return;
  }

  res.json(success(notice));
}

export async function createNotice(req: Request, res: Response) {
  const body = req.body;
  const { title, content, type, target, status, publishedAt } = body;

  if (!title || !content) {
    res.status(400).json(badRequest('标题和内容不能为空'));
    return;
  }

  const result = await prisma.notice.create({
    data: {
      title,
      content,
      type: type || 'SYSTEM',
      target: target || 'ALL',
      status: (status as ContentStatus) || 'ACTIVE',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });

  res.json(success(result, '创建成功'));
}

export async function updateNotice(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的公告 ID'));
    return;
  }

  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('公告不存在'));
    return;
  }

  const { title, content, type, target, status, publishedAt } = req.body;

  const result = await prisma.notice.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(target !== undefined && { target }),
      ...(status !== undefined && { status }),
      ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
    },
  });

  res.json(success(result, '更新成功'));
}

export async function deleteNotice(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的公告 ID'));
    return;
  }

  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('公告不存在'));
    return;
  }

  await prisma.notice.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}
