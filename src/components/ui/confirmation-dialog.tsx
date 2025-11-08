import type { ReactNode } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void | Promise<void>;
	title: string;
	description: string | ReactNode;
	confirmText?: string;
	cancelText?: string;
	variant?: 'destructive' | 'warning' | 'default';
	icon?: ReactNode;
	isLoading?: boolean;
}

export function ConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'default',
	icon,
	isLoading = false,
}: ConfirmationDialogProps) {
	const handleConfirm = async () => {
		await onConfirm();
		if (!isLoading) {
			onOpenChange(false);
		}
	};

	const getIconColor = () => {
		switch (variant) {
			case 'destructive':
				return 'text-red-400';
			case 'warning':
				return 'text-amber-400';
			default:
				return 'text-blue-400';
		}
	};

	const getButtonVariant = () => {
		return variant === 'destructive' ? 'destructive' : 'default';
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
				<DialogHeader>
					{icon && (
						<div className="flex justify-center mb-4">
							<div
								className={`w-12 h-12 rounded-full flex items-center justify-center ${
									variant === 'destructive'
										? 'bg-red-500/20'
										: variant === 'warning'
											? 'bg-amber-500/20'
											: 'bg-blue-500/20'
								}`}
							>
								<div className={getIconColor()}>{icon}</div>
							</div>
						</div>
					)}
					<DialogTitle className="text-center text-white">{title}</DialogTitle>
					<DialogDescription className="text-center text-slate-300">
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border-white/10 text-white"
					>
						{cancelText}
					</Button>
					<Button
						type="button"
						variant={getButtonVariant()}
						onClick={handleConfirm}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
