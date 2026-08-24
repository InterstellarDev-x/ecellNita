const logger=require("../utils/logger");
const {mailsender} = require("./SendMail");

class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.retryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    async addToQueue(email, title, body) {
        const emailJob = {
            id: Date.now() + Math.random(),
            email,
            title,
            body,
            attempts: 0,
            maxAttempts: this.retryAttempts,
            createdAt: new Date()
        };
        
        this.queue.push(emailJob);
        
        if (!this.processing) {
            this.processQueue();
        }
        
        return emailJob.id;
    }

    async processQueue() {
        this.processing = true;
        
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            
            try {
                logger.debug('attempting email to %s (attempt %d/%d)', job.email, job.attempts + 1, job.maxAttempts);
                
                const result = await mailsender(job.email, job.title, job.body);
                logger.info('email sent to %s: %s', job.email, result.messageId);
                
            } catch (error) {
                job.attempts++;
                logger.warn('email failed for %s (attempt %d/%d): %s', job.email, job.attempts, job.maxAttempts, error.message);
                
                if (job.attempts < job.maxAttempts) {
                    logger.debug('retrying email to %s in %dms', job.email, this.retryDelay);
                    
                    setTimeout(() => {
                        this.queue.unshift(job); // Add back to front of queue
                    }, this.retryDelay);
                    
                    // Wait for retry delay before processing next item
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    logger.error('email failed permanently for %s after %d attempts', job.email, job.maxAttempts);
                    // You could save failed emails to a database for manual retry later
                }
            }
        }
        
        this.processing = false;
    }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

module.exports = {
    sendEmailWithRetry: (email, title, body) => emailQueue.addToQueue(email, title, body),
};
