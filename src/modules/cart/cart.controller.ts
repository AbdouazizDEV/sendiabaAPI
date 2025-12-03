import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { CartService } from './services/cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('🛒 Gestion du Panier')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.CUSTOMER,
  UserRole.SELLER,
  UserRole.ENTERPRISE,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer le contenu du panier',
    description: 'Retourne tous les articles du panier de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu du panier récupéré avec succès',
  })
  async getCart(@CurrentUser() user: User) {
    const cart = await this.cartService.getCart(user.id);
    return {
      success: true,
      message: 'Panier récupéré avec succès',
      data: cart,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un produit au panier',
    description: 'Ajoute un produit au panier de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 201,
    description: 'Produit ajouté au panier avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuffisant ou produit non disponible',
  })
  async addItem(@CurrentUser() user: User, @Body() addItemDto: AddCartItemDto) {
    const item = await this.cartService.addItem(user.id, addItemDto);
    return {
      success: true,
      message: 'Produit ajouté au panier avec succès',
      data: item,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('items/:id')
  @ApiOperation({
    summary: 'Modifier la quantité d\'un article',
    description: 'Met à jour la quantité d\'un article dans le panier',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'article du panier' })
  @ApiResponse({
    status: 200,
    description: 'Quantité mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Article non trouvé dans le panier',
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuffisant',
  })
  async updateItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const item = await this.cartService.updateItem(user.id, itemId, updateDto);
    return {
      success: true,
      message: 'Quantité mise à jour avec succès',
      data: item,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un article du panier',
    description: 'Retire un article du panier de l\'utilisateur connecté',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'article du panier' })
  @ApiResponse({
    status: 200,
    description: 'Article supprimé du panier avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Article non trouvé dans le panier',
  })
  async removeItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
  ) {
    const result = await this.cartService.removeItem(user.id, itemId);
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vider le panier',
    description: 'Supprime tous les articles du panier de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Panier vidé avec succès',
  })
  async clearCart(@CurrentUser() user: User) {
    const result = await this.cartService.clearCart(user.id);
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('total')
  @ApiOperation({
    summary: 'Calculer le total du panier',
    description: 'Retourne le total, sous-total et remises du panier',
  })
  @ApiResponse({
    status: 200,
    description: 'Total du panier calculé avec succès',
  })
  async getCartTotal(@CurrentUser() user: User) {
    const total = await this.cartService.getCartTotal(user.id);
    return {
      success: true,
      message: 'Total du panier calculé avec succès',
      data: total,
      timestamp: new Date().toISOString(),
    };
  }
}





