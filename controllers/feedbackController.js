import prisma from '../prismaClient.js';

export const createFeedback = async (req, res) => {
  const { type, message, pageUrl } = req.body;
  const userId = req.user?.id;

  try {
    const feedback = await prisma.feedback.create({
      data: {
        type,
        message,
        pageUrl,
        userId,
      },
    });
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    res.status(500).json({ error: 'Failed to get feedbacks' });
  }
};

export const updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { isResolved, isFeatured } = req.body;

  try {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        isResolved,
        isFeatured,
      },
    });
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.feedback.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

export const getFeaturedFeedbacks = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: {
        isFeatured: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error getting featured feedbacks:', error);
    res.status(500).json({ error: 'Failed to get featured feedbacks' });
  }
};
